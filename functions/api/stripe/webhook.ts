// Stripe webhook handler for subscription events
// Set up with: stripe listen --forward-to localhost:8788/api/stripe/webhook

interface Env {
  DB: D1Database;
  STRIPE_WEBHOOK_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const signature = context.request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  // In production, verify webhook signature with Stripe SDK
  // For now, parse the event directly
  const event = await context.request.json() as {
    type: string;
    data: {
      object: {
        id: string;
        customer: string;
        status: string;
        metadata?: { userId?: string };
      };
    };
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId) {
        await context.env.DB.prepare(
          "UPDATE users SET plan = 'gold', stripe_customer_id = ? WHERE id = ?"
        )
          .bind(session.customer, userId)
          .run();
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      // Downgrade user
      await context.env.DB.prepare(
        "UPDATE users SET plan = 'free' WHERE stripe_customer_id = ?"
      )
        .bind(subscription.customer)
        .run();
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const plan = subscription.status === "active" ? "gold" : "free";
      await context.env.DB.prepare(
        "UPDATE users SET plan = ? WHERE stripe_customer_id = ?"
      )
        .bind(plan, subscription.customer)
        .run();
      break;
    }
  }

  return Response.json({ received: true });
};
