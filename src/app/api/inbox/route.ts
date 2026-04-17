import { NextRequest, NextResponse } from "next/server";

// In-memory inbox store (simulates database for demo)
interface WebhookEvent {
  id: string;
  channel: string;
  eventType: string;
  senderName: string;
  content: string;
  timestamp: string;
  processed: boolean;
}

const webhookEvents: WebhookEvent[] = [];

// Seed with some recent events for demo
webhookEvents.push(
  { id: "WH-VIB-78231", channel: "viber", eventType: "message", senderName: "Acme Corp", content: "Can we get an update on ORD-2847?", timestamp: "2024-01-15T10:35:00Z", processed: true },
  { id: "WH-WX-45291", channel: "wechat", eventType: "message", senderName: "Global Trade Ltd", content: "我们的订单已经到港口了吗？", timestamp: "2024-01-15T10:20:00Z", processed: true },
  { id: "WH-VIB-78240", channel: "viber", eventType: "message", senderName: "Maria Santos", content: "How much is the Wireless Charger Pad?", timestamp: "2024-01-15T10:05:00Z", processed: false },
  { id: "WH-WX-45300", channel: "wechat", eventType: "message", senderName: "张伟 (Wei Zhang)", content: "请问你们有最低起订量要求吗？", timestamp: "2024-01-15T10:30:00Z", processed: false },
  { id: "WH-WX-45305", channel: "wechat", eventType: "message", senderName: "李明 (Ming Li)", content: "这次的包装有问题，有几个产品损坏了", timestamp: "2024-01-15T09:40:00Z", processed: true },
  { id: "WH-VIB-78242", channel: "viber", eventType: "message", senderName: "Prime Logistics", content: "The delivery for ORD-2841 is delayed.", timestamp: "2024-01-15T09:00:00Z", processed: true },
);

// GET /api/inbox — List all webhook events / inbox items
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");
  const processed = searchParams.get("processed");

  let filtered = [...webhookEvents];

  if (channel) {
    filtered = filtered.filter((e) => e.channel === channel);
  }
  if (processed !== null && processed !== undefined && processed !== "") {
    filtered = filtered.filter((e) => e.processed === (processed === "true"));
  }

  return NextResponse.json({
    success: true,
    data: filtered,
    total: webhookEvents.length,
    filteredCount: filtered.length,
  });
}

// POST /api/inbox — Mark events as processed or add new events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, eventId } = body;

    if (action === "mark_processed" && eventId) {
      const event = webhookEvents.find((e) => e.id === eventId);
      if (event) {
        event.processed = true;
        return NextResponse.json({
          success: true,
          message: `Event ${eventId} marked as processed`,
          data: event,
        });
      }
      return NextResponse.json(
        { error: `Event ${eventId} not found` },
        { status: 404 }
      );
    }

    if (action === "add_event") {
      const { channel, eventType, senderName, content } = body;
      if (!channel || !senderName) {
        return NextResponse.json(
          { error: "Missing required fields: channel, senderName" },
          { status: 400 }
        );
      }
      const newEvent: WebhookEvent = {
        id: `WH-${channel === "wechat" ? "WX" : "VIB"}-${Date.now()}`,
        channel,
        eventType: eventType || "message",
        senderName,
        content: content || "",
        timestamp: new Date().toISOString(),
        processed: false,
      };
      webhookEvents.unshift(newEvent);
      return NextResponse.json({
        success: true,
        message: "New event added",
        data: newEvent,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'mark_processed' or 'add_event'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Inbox API] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// DELETE /api/inbox — Remove a webhook event
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("id");

  if (!eventId) {
    return NextResponse.json(
      { error: "Missing 'id' parameter" },
      { status: 400 }
    );
  }

  const index = webhookEvents.findIndex((e) => e.id === eventId);
  if (index === -1) {
    return NextResponse.json(
      { error: `Event ${eventId} not found` },
      { status: 404 }
    );
  }

  const removed = webhookEvents.splice(index, 1);
  return NextResponse.json({
    success: true,
    message: `Event ${eventId} deleted`,
    data: removed[0],
  });
}
