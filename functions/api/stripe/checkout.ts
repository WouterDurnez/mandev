// Create Stripe Checkout session for Gold upgrade
// Requires STRIPE_SECRET_KEY in environment

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const userId = context.data.userId as string;

  const user = await context.env.DB.prepare(
    "SELECT id, email, name FROM users WHERE id = ?"
  )
    .bind(userId)
    .first<{ id: string; email: string; name: string }>();

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Create Stripe Checkout session via API
  const url = new URL(context.request.url);
  const origin = url.origin;

  const params = new URLSearchParams({
    "payment_method_types[]": "card",
    mode: "subscription",
    "line_items[0][price]": "price_REPLACE_WITH_STRIPE_PRICE_ID", // Set your Stripe Price ID
    "line_items[0][quantity]": "1",
    customer_email: user.email,
    "metadata[userId]": user.id,
    success_url: `${origin}/dashboard?upgraded=true`,
    cancel_url: `${origin}/dashboard?upgrade=cancelled`,
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${context.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const session = await response.json() as { url: string; error?: { message: string } };

  if (session.error) {
    return Response.json(
      { error: session.error.message },
      { status: 400 }
    );
  }

  return Response.json({ url: session.url });
};
