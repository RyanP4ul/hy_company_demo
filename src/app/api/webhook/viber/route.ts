import { NextRequest, NextResponse } from "next/server";

// POST /api/webhook/viber — Receives Viber webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required Viber webhook fields
    const { event, sender, message } = body;

    if (!event) {
      return NextResponse.json(
        { error: "Missing 'event' field in webhook payload" },
        { status: 400 }
      );
    }

    console.log("[Viber Webhook] Received event:", event);

    // Handle different Viber events
    switch (event) {
      case "message":
      case "conversation_started": {
        const webhookPayload = {
          webhookId: `WH-VIB-${Date.now()}`,
          channel: "viber",
          event,
          senderId: sender?.id || "unknown",
          senderName: sender?.name || sender?.id || "Unknown",
          messageText: message?.text || "",
          messageType: message?.type || "text",
          timestamp: new Date().toISOString(),
          received: true,
        };

        console.log("[Viber Webhook] Processed:", webhookPayload.webhookId);

        return NextResponse.json({
          success: true,
          message: "Webhook received and processed",
          data: webhookPayload,
        });
      }

      case "seen":
      case "delivered":
      case "failed": {
        console.log(`[Viber Webhook] Message ${event}`);
        return NextResponse.json({
          success: true,
          message: `Message ${event} event acknowledged`,
          timestamp: new Date().toISOString(),
        });
      }

      case "subscribed":
      case "unsubscribed": {
        console.log(`[Viber Webhook] User ${event}`);
        return NextResponse.json({
          success: true,
          message: `User ${event} event acknowledged`,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json({
          success: true,
          message: `Event '${event}' acknowledged`,
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error("[Viber Webhook] Error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// GET /api/webhook/viber — Used for Viber webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "Viber webhook endpoint is active",
    timestamp: new Date().toISOString(),
    events: ["message", "conversation_started", "seen", "delivered", "failed", "subscribed", "unsubscribed"],
  });
}
