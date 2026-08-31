const Stripe = require("stripe");

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function sendWelcomeEmail({ to, plan }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Preemiyum <members@preemiyum.com>";

  if (!apiKey) {
    console.warn("RESEND_API_KEY not configured; skipping welcome email.");
    return { skipped: true };
  }

  const planLabel = plan === "lifetime" ? "Lifetime Membership" : "Monthly Membership";
  const welcomeUrl =
    plan === "lifetime"
      ? "https://preemiyum.com/welcome.html?plan=lifetime"
      : "https://preemiyum.com/welcome.html?plan=monthly";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;color:#111827">
      <h1 style="margin-bottom:8px">Welcome to Preemiyum</h1>
      <p>Thanks for joining <strong>Preemiyum ${planLabel}</strong>.</p>
      <p>Your payment has been received successfully.</p>
      <p>
        <a href="${welcomeUrl}"
           style="display:inline-block;background:#11284A;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">
          Continue Member Onboarding
        </a>
      </p>
      <p>Use the same email address you used at checkout when requesting premium access.</p>
      <p style="margin-top:26px;color:#6b7280;font-size:13px;line-height:1.5">
        Sports betting involves risk. Preemiyum provides sports analysis and betting information,
        not guaranteed outcomes or profits. Please gamble responsibly.
      </p>
    </div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Welcome to Preemiyum ${planLabel}`,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend failed: ${response.status} ${body}`);
  }

  return response.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    res.statusCode = 500;
    return res.end("Stripe webhook is not configured.");
  }

  const stripe = new Stripe(stripeSecretKey);
  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    res.statusCode = 400;
    return res.end(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const email =
        session.customer_details?.email ||
        session.customer_email ||
        null;

      let plan = (session.metadata?.plan || "").toLowerCase();

      // Fallback plan detection from payment link ID if metadata is absent.
      if (!plan && session.payment_link) {
        const link = await stripe.paymentLinks.retrieve(session.payment_link);
        plan = (link.metadata?.plan || "").toLowerCase();
      }

      if (!["monthly", "lifetime"].includes(plan)) {
        console.warn("Unknown Preemiyum plan; session:", session.id, "plan:", plan);
        res.statusCode = 200;
        return res.end("Ignored unknown plan.");
      }

      if (customerId) {
        const metadata = {
          membership_plan: plan,
          member_access_status: "pending",
          joined_via: "preemiyumstats_website",
          joined_at: new Date().toISOString(),
        };

        if (plan === "monthly" && session.subscription) {
          metadata.subscription_id =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
        }

        await stripe.customers.update(customerId, { metadata });
      }

      if (email) {
        await sendWelcomeEmail({ to: email, plan });
      } else {
        console.warn("No checkout email found for session", session.id);
      }
    }

    if (
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.paused"
    ) {
      const subscription = event.data.object;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;

      if (customerId) {
        await stripe.customers.update(customerId, {
          metadata: {
            member_access_status: "review_required",
            last_membership_event: event.type,
            last_membership_event_at: new Date().toISOString(),
          },
        });
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

      if (customerId) {
        await stripe.customers.update(customerId, {
          metadata: {
            member_access_status: "payment_issue",
            last_membership_event: "invoice.payment_failed",
            last_membership_event_at: new Date().toISOString(),
          },
        });
      }
    }

    res.statusCode = 200;
    return res.end("ok");
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.statusCode = 500;
    return res.end("Webhook processing failed.");
  }
};
