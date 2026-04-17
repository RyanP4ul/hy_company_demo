import { NextRequest, NextResponse } from "next/server";

// POST /api/webhook/wechat — Receives WeChat webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required WeChat webhook fields
    const { MsgType, FromUserName, Content, Event } = body;

    console.log("[WeChat Webhook] Received message type:", MsgType || Event);

    // Determine if this is a message or an event
    if (MsgType) {
      // Handle WeChat message types
      const webhookPayload = {
        webhookId: `WH-WX-${Date.now()}`,
        channel: "wechat",
        eventType: "message",
        messageType: MsgType,
        senderId: FromUserName || "unknown",
        content: Content || "",
        timestamp: new Date().toISOString(),
        received: true,
      };

      console.log("[WeChat Webhook] Processed:", webhookPayload.webhookId);

      return NextResponse.json({
        success: true,
        message: "WeChat message received and processed",
        data: webhookPayload,
      });
    }

    if (Event) {
      // Handle WeChat event types (subscribe, unsubscribe, etc.)
      const webhookPayload = {
        webhookId: `WH-WX-${Date.now()}`,
        channel: "wechat",
        eventType: "event",
        eventName: Event,
        senderId: FromUserName || "unknown",
        timestamp: new Date().toISOString(),
        received: true,
      };

      console.log("[WeChat Webhook] Event processed:", webhookPayload.webhookId);

      return NextResponse.json({
        success: true,
        message: `WeChat event '${Event}' received and processed`,
        data: webhookPayload,
      });
    }

    return NextResponse.json(
      { error: "Missing 'MsgType' or 'Event' field in webhook payload" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[WeChat Webhook] Error:", error);
    return NextResponse.json(
      { error: "Failed to process WeChat webhook" },
      { status: 500 }
    );
  }
}

// GET /api/webhook/wechat — WeChat verification endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // WeChat uses signature verification for initial setup
  const signature = searchParams.get("msg_signature");
  const timestamp = searchParams.get("timestamp");
  const nonce = searchParams.get("nonce");
  const echostr = searchParams.get("echostr");

  // If echostr is present, this is WeChat's verification handshake
  if (echostr) {
    console.log("[WeChat Webhook] Verification request received");
    // In production, you would validate the signature here
    return new NextResponse(echostr, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({
    status: "WeChat webhook endpoint is active",
    timestamp: new Date().toISOString(),
    messageTypes: ["text", "image", "voice", "video", "location", "link"],
    events: ["subscribe", "unsubscribe", "SCAN", "LOCATION"],
    verification: "Send msg_signature, timestamp, nonce, and echostr for verification",
  });
}
