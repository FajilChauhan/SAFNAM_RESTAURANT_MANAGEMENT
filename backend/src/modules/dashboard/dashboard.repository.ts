import { prisma } from "../../database/prisma.js";
import type { DashboardQueryDto, DashboardRawRow } from "./dashboard.dto.js";

export class DashboardRepository {
  async customer(customerId: string, query: DashboardQueryDto) {
    return this.first(
      await prisma.$queryRaw<DashboardRawRow[]>`
        WITH active_booking AS (
          SELECT b.*
          FROM bookings b
          WHERE b."customerId" = ${customerId}::uuid
            AND b."deletedAt" IS NULL
            AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
          ORDER BY CASE WHEN b.status = 'CHECKED_IN' THEN 0 ELSE 1 END, b."startAt"
          LIMIT 1
        ),
        active_invoice AS (
          SELECT i.*
          FROM invoices i
          JOIN active_booking ab ON ab.id = i."bookingId"
          WHERE i."deletedAt" IS NULL
          ORDER BY i."createdAt" DESC
          LIMIT 1
        ),
        spending AS (
          SELECT COALESCE(SUM(p.amount - p."refundedAmount"), 0) AS total
          FROM payments p
          JOIN bookings b ON b.id = p."bookingId"
          WHERE p."deletedAt" IS NULL
            AND b."deletedAt" IS NULL
            AND b."customerId" = ${customerId}::uuid
            AND p.status IN ('SUCCESS', 'PARTIALLY_REFUNDED')
        ),
        leaderboard AS (
          SELECT 1 + COUNT(*) AS position
          FROM (
            SELECT b."customerId", COALESCE(SUM(p.amount - p."refundedAmount"), 0) AS total
            FROM payments p
            JOIN bookings b ON b.id = p."bookingId"
            WHERE p."deletedAt" IS NULL AND b."deletedAt" IS NULL AND p.status IN ('SUCCESS', 'PARTIALLY_REFUNDED')
            GROUP BY b."customerId"
          ) ranked
          WHERE ranked.total > (SELECT total FROM spending)
        )
        SELECT
          (SELECT jsonb_build_object(
            'id', ab.id,
            'bookingNumber', ab."bookingNumber",
            'bookingType', ab."bookingType",
            'bookingDate', ab."bookingDate",
            'startTime', ab."startTime",
            'endTime', ab."endTime",
            'members', ab.members,
            'status', ab.status,
            'source', ab.source
          ) FROM active_booking ab) AS "currentActiveBooking",
          (SELECT jsonb_build_object('id', t.id, 'tableNumber', t."tableNumber", 'capacity', t.capacity, 'shape', t.shape, 'status', t.status)
           FROM active_booking ab JOIN tables t ON t.id = ab."tableId" WHERE t."deletedAt" IS NULL) AS "currentTable",
          (SELECT jsonb_build_object('id', r.id, 'roomNumber', r."roomNumber", 'roomType', r."roomType", 'capacity', r.capacity, 'status', r.status, 'pricePerDay', r."pricePerDay")
           FROM active_booking ab JOIN rooms r ON r.id = ab."roomId" WHERE r."deletedAt" IS NULL) AS "currentRoom",
          (SELECT jsonb_build_object(
            'id', c.id,
            'status', c.status,
            'items', COALESCE(jsonb_agg(jsonb_build_object(
              'id', ci.id,
              'menuItemId', ci."menuItemId",
              'name', mi.name,
              'quantity', ci.quantity,
              'unitPrice', ci."unitPriceSnapshot",
              'lineTotal', ci."lineTotalSnapshot"
            ) ORDER BY ci."createdAt") FILTER (WHERE ci.id IS NOT NULL), '[]'::jsonb),
            'itemCount', COALESCE(SUM(ci.quantity), 0),
            'total', COALESCE(SUM(ci."lineTotalSnapshot"), 0)
          )
           FROM active_booking ab
           JOIN carts c ON c."bookingId" = ab.id AND c.status = 'ACTIVE' AND c."deletedAt" IS NULL
           LEFT JOIN cart_items ci ON ci."cartId" = c.id AND ci."deletedAt" IS NULL
           LEFT JOIN menu_items mi ON mi.id = ci."menuItemId"
           GROUP BY c.id, c.status
           LIMIT 1) AS "currentCart",
          COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'id', o.id,
            'orderNumber', o."orderNumber",
            'status', o.status,
            'total', o."totalSnapshot",
            'confirmedAt', o."confirmedAt",
            'kitchenStatus', kq.status,
            'priority', kq.priority
          ) ORDER BY o."confirmedAt" DESC)
           FROM active_booking ab
           JOIN orders o ON o."bookingId" = ab.id
           LEFT JOIN kitchen_queue kq ON kq."orderId" = o.id AND kq."deletedAt" IS NULL
           WHERE o."deletedAt" IS NULL AND o.status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY')), '[]'::jsonb) AS "currentOrders",
          (SELECT jsonb_build_object(
            'id', ai.id,
            'invoiceNumber', ai."invoiceNumber",
            'status', ai.status,
            'grandTotal', ai."grandTotal",
            'paidAmount', ai."paidAmount",
            'balanceAmount', ai."balanceAmount",
            'generatedAt', ai."generatedAt"
          ) FROM active_invoice ai) AS "currentInvoice",
          (SELECT jsonb_build_object(
            'invoiceStatus', ai.status,
            'paidAmount', ai."paidAmount",
            'balanceAmount', ai."balanceAmount",
            'latestPaymentStatus', (SELECT p.status FROM payments p WHERE p."invoiceId" = ai.id AND p."deletedAt" IS NULL ORDER BY p."paidAt" DESC LIMIT 1)
          ) FROM active_invoice ai) AS "paymentStatus",
          COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'id', b.id,
            'bookingNumber', b."bookingNumber",
            'bookingType', b."bookingType",
            'bookingDate', b."bookingDate",
            'status', b.status,
            'tableNumber', t."tableNumber",
            'roomNumber', r."roomNumber"
          ) ORDER BY b."startAt" DESC)
           FROM (SELECT * FROM bookings WHERE "customerId" = ${customerId}::uuid AND "deletedAt" IS NULL ORDER BY "startAt" DESC LIMIT ${query.historyLimit}) b
           LEFT JOIN tables t ON t.id = b."tableId"
           LEFT JOIN rooms r ON r.id = b."roomId"), '[]'::jsonb) AS "bookingHistory",
          COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'id', o.id,
            'orderNumber', o."orderNumber",
            'status', o.status,
            'total', o."totalSnapshot",
            'confirmedAt', o."confirmedAt"
          ) ORDER BY o."confirmedAt" DESC)
           FROM (SELECT * FROM orders WHERE "orderedById" = ${customerId}::uuid AND "deletedAt" IS NULL ORDER BY "confirmedAt" DESC LIMIT ${query.historyLimit}) o), '[]'::jsonb) AS "recentOrders",
          COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'menuItemId', fav."menuItemId",
            'name', fav."itemNameSnapshot",
            'quantity', fav.quantity,
            'orderCount', fav."orderCount"
          ) ORDER BY fav.quantity DESC)
           FROM (
             SELECT oi."menuItemId", oi."itemNameSnapshot", SUM(oi.quantity) AS quantity, COUNT(DISTINCT oi."orderId") AS "orderCount"
             FROM order_items oi
             JOIN orders o ON o.id = oi."orderId"
             WHERE o."orderedById" = ${customerId}::uuid AND o."deletedAt" IS NULL AND oi."deletedAt" IS NULL
             GROUP BY oi."menuItemId", oi."itemNameSnapshot"
             ORDER BY quantity DESC
             LIMIT ${query.listLimit}
           ) fav), '[]'::jsonb) AS "favouriteFoods",
          (SELECT COUNT(*) FROM checkout_sessions cs WHERE cs."customerId" = ${customerId}::uuid AND cs."deletedAt" IS NULL) AS "visitCount",
          (SELECT total FROM spending) AS "totalSpending",
          (SELECT position FROM leaderboard) AS "leaderboardPosition",
          COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'id', o.id,
            'title', o.title,
            'description', o.description,
            'code', o.code,
            'discountType', o."discountType",
            'discountValue', o."discountValue",
            'minSpend', o."minSpend",
            'maxDiscount', o."maxDiscount",
            'endsAt', o."endsAt"
          ) ORDER BY o."endsAt")
           FROM offers o
           WHERE o.status = 'ACTIVE' AND o."deletedAt" IS NULL AND o."startsAt" <= NOW() AND o."endsAt" >= NOW()), '[]'::jsonb) AS "availableOffers",
          COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'id', gr.id,
            'rewardCode', gr."rewardCode",
            'discountType', gr."discountType",
            'discountValue', gr."discountValue",
            'expiresAt', gr."expiresAt"
          ) ORDER BY gr."expiresAt")
           FROM game_rewards gr
           WHERE gr."customerId" = ${customerId}::uuid AND gr.status = 'ACTIVE' AND gr."expiresAt" > NOW() AND gr."deletedAt" IS NULL), '[]'::jsonb) AS rewards,
          COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'id', n.id,
            'type', n.type,
            'title', n.title,
            'message', n.message,
            'readAt', n."readAt",
            'createdAt', n."createdAt"
          ) ORDER BY n."createdAt" DESC)
           FROM (SELECT * FROM customer_notifications WHERE "customerId" = ${customerId}::uuid AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT ${query.listLimit}) n), '[]'::jsonb) AS notifications,
          COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'id', f.id,
            'foodRating', f."foodRating",
            'serviceRating', f."serviceRating",
            'comments', f.comments,
            'createdAt', f."createdAt"
          ) ORDER BY f."createdAt" DESC)
           FROM (SELECT * FROM customer_feedback WHERE "customerId" = ${customerId}::uuid AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT ${query.listLimit}) f), '[]'::jsonb) AS "recentFeedback"
      `,
    );
  }

  async reception(query: DashboardQueryDto) {
    return this.first(
      await prisma.$queryRaw<DashboardRawRow[]>`
        WITH active_bookings AS (
          SELECT
            b.id,
            b."bookingNumber",
            b."bookingType",
            b."tableId",
            b."roomId",
            b."bookingDate",
            b."startTime",
            b."endTime",
            b."endAt",
            b.members,
            b."checkedInAt",
            u.id AS "customerId",
            u."fullName",
            u."phoneNumber",
            i.id AS "invoiceId",
            i.status AS "invoiceStatus",
            (
              SELECT p.status
              FROM payments p
              WHERE p."bookingId" = b.id
                AND p."deletedAt" IS NULL
              ORDER BY p."paidAt" DESC
              LIMIT 1
            ) AS "latestPaymentStatus",
            (
              SELECT COUNT(*)
              FROM orders o
              WHERE o."bookingId" = b.id
                AND o."deletedAt" IS NULL
                AND o.status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY')
            ) AS "activeOrderCount"
          FROM bookings b
          JOIN users u ON u.id = b."customerId"
          LEFT JOIN invoices i ON i."bookingId" = b.id AND i."deletedAt" IS NULL
          LEFT JOIN checkout_sessions cs ON cs."bookingId" = b.id AND cs."deletedAt" IS NULL
          WHERE b."deletedAt" IS NULL
            AND b.status = 'CHECKED_IN'
            AND b."checkedInAt" IS NOT NULL
            AND b."checkedOutAt" IS NULL
            AND cs.id IS NULL
        ),
        active_table_bookings AS (
          SELECT DISTINCT ON (ab."tableId") ab.*
          FROM active_bookings ab
          WHERE ab."bookingType" = 'TABLE' AND ab."tableId" IS NOT NULL
          ORDER BY ab."tableId", ab."checkedInAt" DESC
        ),
        active_room_bookings AS (
          SELECT DISTINCT ON (ab."roomId") ab.*
          FROM active_bookings ab
          WHERE ab."bookingType" = 'ROOM' AND ab."roomId" IS NOT NULL
          ORDER BY ab."roomId", ab."checkedInAt" DESC
        ),
        table_status AS (
          SELECT
            t.id,
            t."tableNumber",
            t.capacity,
            t.shape,
            t."floorId",
            CASE WHEN atb.id IS NOT NULL THEN 'OCCUPIED' ELSE t.status::text END AS status,
            CASE WHEN atb.id IS NULL THEN NULL ELSE jsonb_build_object(
              'bookingId', atb.id,
              'bookingNumber', atb."bookingNumber",
              'customer', jsonb_build_object(
                'id', atb."customerId",
                'name', atb."fullName",
                'phoneNumber', atb."phoneNumber"
              ),
              'occupiedAt', atb."checkedInAt",
              'bookingStartTime', atb."startTime",
              'bookingEndTime', atb."endTime",
              'expectedReleaseAt', (atb."bookingDate"::timestamp + atb."endTime"::time),
              'durationMinutes', GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - atb."checkedInAt")) / 60))::int,
              'paymentStatus', COALESCE(
                CASE
                  WHEN atb."invoiceStatus" = 'PAID' THEN 'PAID'
                  WHEN atb."invoiceStatus" = 'PARTIALLY_PAID' THEN 'PARTIAL'
                  WHEN atb."invoiceStatus" IS NOT NULL THEN 'PENDING'
                  ELSE atb."latestPaymentStatus"::text
                END,
                'PENDING'
              ),
              'invoiceStatus', atb."invoiceStatus",
              'hasActiveOrder', atb."activeOrderCount" > 0,
              'activeOrderCount', atb."activeOrderCount"
            ) END AS "activeOccupancy"
          FROM tables t
          LEFT JOIN active_table_bookings atb ON atb."tableId" = t.id
          WHERE t."deletedAt" IS NULL
        ),
        room_status AS (
          SELECT
            r.id,
            r."roomNumber",
            r."roomType",
            r.capacity,
            r."pricePerDay",
            r."imageUrl",
            CASE WHEN arb.id IS NOT NULL THEN 'OCCUPIED' ELSE r.status::text END AS status,
            CASE WHEN arb.id IS NULL THEN NULL ELSE jsonb_build_object(
              'bookingId', arb.id,
              'bookingNumber', arb."bookingNumber",
              'guest', jsonb_build_object(
                'id', arb."customerId",
                'name', arb."fullName",
                'phoneNumber', arb."phoneNumber"
              ),
              'checkedInAt', arb."checkedInAt",
              'expectedCheckoutAt', arb."endAt",
              'stayDuration', jsonb_build_object(
                'days', GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - arb."checkedInAt")) / 86400))::int,
                'hours', MOD(GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - arb."checkedInAt")) / 3600))::int, 24)
              ),
              'paymentStatus', COALESCE(
                CASE
                  WHEN arb."invoiceStatus" = 'PAID' THEN 'PAID'
                  WHEN arb."invoiceStatus" = 'PARTIALLY_PAID' THEN 'PARTIAL'
                  WHEN arb."invoiceStatus" IS NOT NULL THEN 'PENDING'
                  ELSE arb."latestPaymentStatus"::text
                END,
                'PENDING'
              ),
              'invoiceStatus', arb."invoiceStatus",
              'totalGuests', arb.members,
              'hasActiveOrder', arb."activeOrderCount" > 0,
              'activeOrderCount', arb."activeOrderCount"
            ) END AS "activeOccupancy"
          FROM rooms r
          LEFT JOIN active_room_bookings arb ON arb."roomId" = r.id
          WHERE r."deletedAt" IS NULL
        ),
        current_customers AS (
          SELECT
            'TABLE' AS type,
            atb.id AS "bookingId",
            atb."bookingNumber",
            atb."fullName" AS "customerName",
            atb."phoneNumber",
            t."tableNumber" AS "resourceNumber",
            atb."checkedInAt" AS "occupiedAt",
            NULL::timestamp AS "expectedCheckoutAt",
            GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - atb."checkedInAt")) / 60))::int AS "durationMinutes",
            COALESCE(
              CASE
                WHEN atb."invoiceStatus" = 'PAID' THEN 'PAID'
                WHEN atb."invoiceStatus" = 'PARTIALLY_PAID' THEN 'PARTIAL'
                WHEN atb."invoiceStatus" IS NOT NULL THEN 'PENDING'
                ELSE atb."latestPaymentStatus"::text
              END,
              'PENDING'
            ) AS "paymentStatus"
          FROM active_table_bookings atb
          JOIN tables t ON t.id = atb."tableId"
          UNION ALL
          SELECT
            'ROOM' AS type,
            arb.id AS "bookingId",
            arb."bookingNumber",
            arb."fullName" AS "customerName",
            arb."phoneNumber",
            r."roomNumber" AS "resourceNumber",
            arb."checkedInAt" AS "occupiedAt",
            arb."endAt" AS "expectedCheckoutAt",
            GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - arb."checkedInAt")) / 60))::int AS "durationMinutes",
            COALESCE(
              CASE
                WHEN arb."invoiceStatus" = 'PAID' THEN 'PAID'
                WHEN arb."invoiceStatus" = 'PARTIALLY_PAID' THEN 'PARTIAL'
                WHEN arb."invoiceStatus" IS NOT NULL THEN 'PENDING'
                ELSE arb."latestPaymentStatus"::text
              END,
              'PENDING'
            ) AS "paymentStatus"
          FROM active_room_bookings arb
          JOIN rooms r ON r.id = arb."roomId"
        )
        SELECT
          COALESCE((SELECT jsonb_agg(jsonb_build_object(
            'id', b.id,
            'bookingNumber', b."bookingNumber",
            'customerName', u."fullName",
            'phoneNumber', u."phoneNumber",
            'bookingType', b."bookingType",
            'startTime', b."startTime",
            'endTime', b."endTime",
            'members', b.members,
            'status', b.status,
            'tableNumber', t."tableNumber",
            'roomNumber', r."roomNumber"
          ) ORDER BY b."startAt")
           FROM bookings b
           JOIN users u ON u.id = b."customerId"
           LEFT JOIN tables t ON t.id = b."tableId"
           LEFT JOIN rooms r ON r.id = b."roomId"
           WHERE b."deletedAt" IS NULL AND b."bookingDate" = CURRENT_DATE), '[]'::jsonb) AS "todaysBookings",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id', b.id, 'bookingNumber', b."bookingNumber", 'customerName', u."fullName", 'createdAt', b."createdAt") ORDER BY b."createdAt" DESC)
           FROM bookings b JOIN users u ON u.id = b."customerId"
           WHERE b."deletedAt" IS NULL AND b.source = 'RECEPTION' AND b."createdAt" >= CURRENT_DATE AND b."createdAt" < CURRENT_DATE + INTERVAL '1 day'), '[]'::jsonb) AS "todaysWalkIns",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id', b.id, 'bookingNumber', b."bookingNumber", 'customerName', u."fullName", 'checkedInAt', b."checkedInAt") ORDER BY b."checkedInAt" DESC)
           FROM bookings b JOIN users u ON u.id = b."customerId"
           WHERE b."deletedAt" IS NULL AND b."checkedInAt" >= CURRENT_DATE AND b."checkedInAt" < CURRENT_DATE + INTERVAL '1 day'), '[]'::jsonb) AS "todaysCheckIns",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id', cs.id, 'checkoutNumber', cs."checkoutNumber", 'customerName', u."fullName", 'invoiceTotal', cs."invoiceTotal", 'checkedOutAt', cs."checkedOutAt") ORDER BY cs."checkedOutAt" DESC)
           FROM checkout_sessions cs JOIN users u ON u.id = cs."customerId"
           WHERE cs."deletedAt" IS NULL AND cs."checkedOutAt" >= CURRENT_DATE AND cs."checkedOutAt" < CURRENT_DATE + INTERVAL '1 day'), '[]'::jsonb) AS "todaysCheckouts",
          COALESCE((SELECT jsonb_agg(to_jsonb(ts) ORDER BY ts."tableNumber") FROM table_status ts), '[]'::jsonb) AS "tableStatus",
          COALESCE((SELECT jsonb_agg(to_jsonb(rs) ORDER BY rs."roomNumber") FROM room_status rs), '[]'::jsonb) AS "roomStatus",
          COALESCE((SELECT jsonb_agg(to_jsonb(ts) ORDER BY ts."tableNumber") FROM table_status ts WHERE ts.status = 'OCCUPIED'), '[]'::jsonb) AS "occupiedTables",
          COALESCE((SELECT jsonb_agg(to_jsonb(ts) ORDER BY ts."tableNumber") FROM table_status ts WHERE ts.status = 'AVAILABLE'), '[]'::jsonb) AS "availableTables",
          COALESCE((SELECT jsonb_agg(to_jsonb(ts) ORDER BY ts."tableNumber") FROM table_status ts WHERE ts.status = 'RESERVED'), '[]'::jsonb) AS "reservedTables",
          COALESCE((SELECT jsonb_agg(to_jsonb(ts) ORDER BY ts."tableNumber") FROM table_status ts WHERE ts.status = 'CLEANING'), '[]'::jsonb) AS "cleaningTables",
          COALESCE((SELECT jsonb_agg(to_jsonb(rs) ORDER BY rs."roomNumber") FROM room_status rs WHERE rs.status = 'OCCUPIED'), '[]'::jsonb) AS "occupiedRooms",
          COALESCE((SELECT jsonb_agg(to_jsonb(rs) ORDER BY rs."roomNumber") FROM room_status rs WHERE rs.status = 'AVAILABLE'), '[]'::jsonb) AS "availableRooms",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id', p.id, 'paymentNumber', p."paymentNumber", 'amount', p.amount, 'method', p.method, 'status', p.status, 'paidAt', p."paidAt") ORDER BY p."paidAt" DESC)
           FROM (SELECT * FROM payments WHERE "deletedAt" IS NULL AND status IN ('PENDING', 'PROCESSING') ORDER BY "paidAt" DESC LIMIT ${query.listLimit}) p), '[]'::jsonb) AS "pendingPayments",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id', i.id, 'invoiceNumber', i."invoiceNumber", 'customerName', u."fullName", 'grandTotal', i."grandTotal", 'balanceAmount', i."balanceAmount", 'status', i.status) ORDER BY i."generatedAt" DESC NULLS LAST)
           FROM (SELECT * FROM invoices WHERE "deletedAt" IS NULL AND status IN ('GENERATED', 'PARTIALLY_PAID') AND "balanceAmount" > 0 ORDER BY "generatedAt" DESC NULLS LAST LIMIT ${query.listLimit}) i
           JOIN bookings b ON b.id = i."bookingId"
           JOIN users u ON u.id = b."customerId"), '[]'::jsonb) AS "pendingInvoices",
          COALESCE((SELECT jsonb_agg(to_jsonb(cc) ORDER BY cc."occupiedAt" DESC) FROM current_customers cc), '[]'::jsonb) AS "currentCustomers",
          COALESCE((SELECT jsonb_agg(activity ORDER BY activity->>'createdAt' DESC)
           FROM (
             SELECT activity
             FROM (
               SELECT jsonb_build_object('type', 'BOOKING', 'title', b."bookingNumber", 'status', b.status, 'createdAt', b."createdAt") AS activity FROM bookings b WHERE b."deletedAt" IS NULL
               UNION ALL
               SELECT jsonb_build_object('type', 'PAYMENT', 'title', p."paymentNumber", 'status', p.status, 'createdAt', p."paidAt") AS activity FROM payments p WHERE p."deletedAt" IS NULL
               UNION ALL
               SELECT jsonb_build_object('type', 'CHECKOUT', 'title', cs."checkoutNumber", 'status', 'COMPLETED', 'createdAt', cs."checkedOutAt") AS activity FROM checkout_sessions cs WHERE cs."deletedAt" IS NULL
             ) activity_rows
             ORDER BY activity->>'createdAt' DESC
             LIMIT ${query.listLimit}
           ) recent), '[]'::jsonb) AS "recentActivities"
      `,
    );
  }

  async kitchen(query: DashboardQueryDto) {
    return this.first(
      await prisma.$queryRaw<DashboardRawRow[]>`
        WITH queue AS (
          SELECT kq.*, o."orderNumber", o.status AS "orderStatus", o."confirmedAt",
            b.id AS "bookingId",
            b."bookingNumber",
            b."bookingType",
            CASE
              WHEN b."bookingType" = 'ROOM' THEN 'ROOM'
              WHEN b."bookingType" = 'TABLE' THEN 'TABLE'
              ELSE 'WALK_IN'
            END AS "orderSource",
            t.id AS "tableId",
            t."tableNumber",
            r.id AS "roomId",
            r."roomNumber",
            u."fullName" AS "customerName",
            COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                'name', oi."itemNameSnapshot",
                'quantity', oi.quantity,
                'variant', oi."variantNameSnapshot",
                'notes', oi."specialNotes"
              ))
              FROM order_items oi
              WHERE oi."orderId" = o.id AND oi."deletedAt" IS NULL
            ), '[]'::jsonb) AS items
          FROM kitchen_queue kq
          JOIN orders o ON o.id = kq."orderId"
          JOIN bookings b ON b.id = o."bookingId"
          JOIN users u ON u.id = b."customerId"
          LEFT JOIN tables t ON t.id = b."tableId"
          LEFT JOIN rooms r ON r.id = b."roomId"
          WHERE kq."deletedAt" IS NULL AND o."deletedAt" IS NULL
        )
        SELECT
          COALESCE((SELECT jsonb_agg(to_jsonb(q) ORDER BY q."queuedAt") FROM queue q WHERE q.status = 'PENDING'), '[]'::jsonb) AS "pendingOrders",
          COALESCE((SELECT jsonb_agg(to_jsonb(q) ORDER BY q."acceptedAt" DESC NULLS LAST) FROM queue q WHERE q.status = 'ACCEPTED'), '[]'::jsonb) AS "acceptedOrders",
          COALESCE((SELECT jsonb_agg(to_jsonb(q) ORDER BY q."startedAt" NULLS LAST, q."queuedAt") FROM queue q WHERE q.status = 'PREPARING'), '[]'::jsonb) AS "preparingOrders",
          COALESCE((SELECT jsonb_agg(to_jsonb(q) ORDER BY q."readyAt" DESC NULLS LAST) FROM queue q WHERE q.status = 'READY'), '[]'::jsonb) AS "readyOrders",
          COALESCE((SELECT jsonb_agg(to_jsonb(q) ORDER BY q."servedAt" DESC NULLS LAST) FROM queue q WHERE q.status = 'SERVED' AND q."servedAt" >= CURRENT_DATE AND q."servedAt" < CURRENT_DATE + INTERVAL '1 day'), '[]'::jsonb) AS "servedOrders",
          COALESCE((SELECT jsonb_agg(to_jsonb(q) ORDER BY COALESCE(q."servedAt", q."updatedAt", q."queuedAt") DESC)
           FROM (SELECT * FROM queue WHERE status IN ('SERVED', 'CANCELLED') ORDER BY COALESCE("servedAt", "updatedAt", "queuedAt") DESC LIMIT ${query.historyLimit}) q), '[]'::jsonb) AS "kitchenHistory",
          COALESCE((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.priority DESC, q."queuedAt") FROM queue q WHERE q.priority IN ('HIGH', 'VIP') AND q.status IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY')), '[]'::jsonb) AS "priorityOrders",
          COALESCE((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.priority DESC, q."queuedAt") FROM (SELECT * FROM queue WHERE status IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY') ORDER BY priority DESC, "queuedAt" LIMIT ${query.listLimit}) q), '[]'::jsonb) AS "kitchenQueue",
          COALESCE((SELECT AVG(EXTRACT(EPOCH FROM (q."readyAt" - q."startedAt")) / 60) FROM queue q WHERE q."startedAt" IS NOT NULL AND q."readyAt" IS NOT NULL), 0) AS "averagePreparationTime",
          COALESCE((SELECT jsonb_agg(to_jsonb(q) ORDER BY q."confirmedAt" DESC) FROM queue q WHERE q."confirmedAt" >= CURRENT_DATE AND q."confirmedAt" < CURRENT_DATE + INTERVAL '1 day'), '[]'::jsonb) AS "todaysOrders",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('label', hourly.hour, 'value', hourly.count) ORDER BY hourly.hour)
           FROM (
             SELECT EXTRACT(HOUR FROM q."confirmedAt")::int AS hour, COUNT(*) AS count
             FROM queue q
             WHERE q."confirmedAt" >= CURRENT_DATE AND q."confirmedAt" < CURRENT_DATE + INTERVAL '1 day'
             GROUP BY EXTRACT(HOUR FROM q."confirmedAt")
           ) hourly), '[]'::jsonb) AS "ordersByHour",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('label', category_times.name, 'value', category_times.minutes) ORDER BY category_times.minutes DESC)
           FROM (
             SELECT mc.name, AVG(EXTRACT(EPOCH FROM (q."readyAt" - q."startedAt")) / 60) AS minutes
             FROM queue q
             JOIN order_items oi ON oi."orderId" = q."orderId" AND oi."deletedAt" IS NULL
             JOIN menu_items mi ON mi.id = oi."menuItemId"
             JOIN menu_categories mc ON mc.id = mi."categoryId"
             WHERE q."startedAt" IS NOT NULL AND q."readyAt" IS NOT NULL
             GROUP BY mc.name
             ORDER BY minutes DESC
             LIMIT ${query.listLimit}
           ) category_times), '[]'::jsonb) AS "averageTimeByCategory",
          jsonb_build_object(
            'pending', (SELECT COUNT(*) FROM queue WHERE status = 'PENDING'),
            'accepted', (SELECT COUNT(*) FROM queue WHERE status = 'ACCEPTED'),
            'preparing', (SELECT COUNT(*) FROM queue WHERE status = 'PREPARING'),
            'ready', (SELECT COUNT(*) FROM queue WHERE status = 'READY'),
            'servedToday', (SELECT COUNT(*) FROM queue WHERE status = 'SERVED' AND "servedAt" >= CURRENT_DATE AND "servedAt" < CURRENT_DATE + INTERVAL '1 day'),
            'priorityActive', (SELECT COUNT(*) FROM queue WHERE priority IN ('HIGH', 'VIP') AND status IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY'))
          ) AS "kitchenStatistics"
      `,
    );
  }

  async manager(query: DashboardQueryDto) {
    return this.first(
      await prisma.$queryRaw<DashboardRawRow[]>`
        SELECT
          COALESCE((SELECT SUM(cs."invoiceTotal") FROM checkout_sessions cs WHERE cs."deletedAt" IS NULL AND cs."checkedOutAt" >= CURRENT_DATE AND cs."checkedOutAt" < CURRENT_DATE + INTERVAL '1 day'), 0) AS "todaysRevenue",
          COALESCE((SELECT SUM(cs."invoiceTotal") FROM checkout_sessions cs WHERE cs."deletedAt" IS NULL AND date_trunc('month', cs."checkedOutAt") = date_trunc('month', NOW())), 0) AS "monthlyRevenue",
          (SELECT COUNT(*) FROM orders o WHERE o."deletedAt" IS NULL AND o."confirmedAt" >= CURRENT_DATE AND o."confirmedAt" < CURRENT_DATE + INTERVAL '1 day') AS "todaysOrders",
          (SELECT COUNT(*) FROM bookings b WHERE b."deletedAt" IS NULL AND b."bookingDate" = CURRENT_DATE) AS "todaysBookings",
          (SELECT COUNT(DISTINCT b."customerId") FROM bookings b WHERE b."deletedAt" IS NULL AND b."bookingDate" = CURRENT_DATE) AS "todaysCustomers",
          COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t."tableNumber") FROM tables t WHERE t."deletedAt" IS NULL AND t.status = 'OCCUPIED'), '[]'::jsonb) AS "occupiedTables",
          COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r."roomNumber") FROM rooms r WHERE r."deletedAt" IS NULL AND r.status = 'OCCUPIED'), '[]'::jsonb) AS "occupiedRooms",
          (SELECT COUNT(*) FROM kitchen_queue kq WHERE kq."deletedAt" IS NULL AND kq.status IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY')) AS "kitchenQueueCount",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id', p.id, 'paymentNumber', p."paymentNumber", 'amount', p.amount, 'method', p.method, 'status', p.status, 'paidAt', p."paidAt") ORDER BY p."paidAt" DESC)
           FROM (SELECT * FROM payments WHERE "deletedAt" IS NULL AND status IN ('PENDING', 'PROCESSING') ORDER BY "paidAt" DESC LIMIT ${query.listLimit}) p), '[]'::jsonb) AS "pendingPayments",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('menuItemId', x."menuItemId", 'name', x."itemNameSnapshot", 'quantity', x.quantity, 'revenue', x.revenue) ORDER BY x.quantity DESC)
           FROM (
             SELECT oi."menuItemId", oi."itemNameSnapshot", SUM(oi.quantity) AS quantity, SUM(oi."lineTotalSnapshot") AS revenue
             FROM order_items oi JOIN orders o ON o.id = oi."orderId"
             WHERE oi."deletedAt" IS NULL AND o."deletedAt" IS NULL
             GROUP BY oi."menuItemId", oi."itemNameSnapshot"
             ORDER BY quantity DESC
             LIMIT ${query.listLimit}
           ) x), '[]'::jsonb) AS "topSellingFoods",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('categoryId', x.id, 'name', x.name, 'quantity', x.quantity, 'revenue', x.revenue) ORDER BY x.quantity DESC)
           FROM (
             SELECT mc.id, mc.name, SUM(oi.quantity) AS quantity, SUM(oi."lineTotalSnapshot") AS revenue
             FROM order_items oi
             JOIN menu_items mi ON mi.id = oi."menuItemId"
             JOIN menu_categories mc ON mc.id = mi."categoryId"
             JOIN orders o ON o.id = oi."orderId"
             WHERE oi."deletedAt" IS NULL AND o."deletedAt" IS NULL AND mi."deletedAt" IS NULL AND mc."deletedAt" IS NULL
             GROUP BY mc.id, mc.name
             ORDER BY quantity DESC
             LIMIT ${query.listLimit}
           ) x), '[]'::jsonb) AS "topCategories",
          jsonb_build_object(
            'totalCustomers', (SELECT COUNT(*) FROM users u WHERE u."deletedAt" IS NULL AND u.role = 'CUSTOMER'),
            'newCustomersToday', (SELECT COUNT(*) FROM users u WHERE u."deletedAt" IS NULL AND u.role = 'CUSTOMER' AND u."createdAt" >= CURRENT_DATE AND u."createdAt" < CURRENT_DATE + INTERVAL '1 day'),
            'activeCustomersToday', (SELECT COUNT(DISTINCT b."customerId") FROM bookings b WHERE b."deletedAt" IS NULL AND b."bookingDate" = CURRENT_DATE),
            'averageSpending', COALESCE((SELECT AVG(u."totalSpending") FROM users u WHERE u."deletedAt" IS NULL AND u.role = 'CUSTOMER'), 0)
          ) AS "customerStatistics",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id', o.id, 'orderNumber', o."orderNumber", 'status', o.status, 'total', o."totalSnapshot", 'confirmedAt', o."confirmedAt") ORDER BY o."confirmedAt" DESC)
           FROM (SELECT * FROM orders WHERE "deletedAt" IS NULL ORDER BY "confirmedAt" DESC LIMIT ${query.listLimit}) o), '[]'::jsonb) AS "recentOrders",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id', b.id, 'bookingNumber', b."bookingNumber", 'customerName', u."fullName", 'bookingType', b."bookingType", 'status', b.status, 'startAt', b."startAt") ORDER BY b."createdAt" DESC)
           FROM (SELECT * FROM bookings WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT ${query.listLimit}) b JOIN users u ON u.id = b."customerId"), '[]'::jsonb) AS "recentBookings",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id', p.id, 'paymentNumber', p."paymentNumber", 'amount', p.amount, 'method', p.method, 'status', p.status, 'paidAt', p."paidAt") ORDER BY p."paidAt" DESC)
           FROM (SELECT * FROM payments WHERE "deletedAt" IS NULL ORDER BY "paidAt" DESC LIMIT ${query.listLimit}) p), '[]'::jsonb) AS "recentPayments",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id', f.id, 'customerName', u."fullName", 'foodRating', f."foodRating", 'serviceRating', f."serviceRating", 'comments', f.comments, 'createdAt', f."createdAt") ORDER BY f."createdAt" DESC)
           FROM (SELECT * FROM customer_feedback WHERE "deletedAt" IS NULL AND status = 'PUBLISHED' ORDER BY "createdAt" DESC LIMIT ${query.listLimit}) f JOIN users u ON u.id = f."customerId"), '[]'::jsonb) AS "recentFeedback",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id', o.id, 'title', o.title, 'code', o.code, 'type', o.type, 'discountType', o."discountType", 'discountValue', o."discountValue", 'endsAt', o."endsAt") ORDER BY o."endsAt")
           FROM offers o WHERE o."deletedAt" IS NULL AND o.status = 'ACTIVE' AND o."startsAt" <= NOW() AND o."endsAt" >= NOW()), '[]'::jsonb) AS "currentOffers",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id', mi.id, 'name', mi.name, 'categoryName', mc.name, 'status', mi.status, 'isAvailable', mi."isAvailable", 'updatedAt', mi."updatedAt") ORDER BY mi."updatedAt" DESC)
           FROM menu_items mi JOIN menu_categories mc ON mc.id = mi."categoryId"
           WHERE mi."deletedAt" IS NULL AND (mi.status <> 'ACTIVE' OR mi."isAvailable" = false)
           LIMIT ${query.listLimit}), '[]'::jsonb) AS "lowAvailabilityMenuItems",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('label', chart.label, 'value', chart.value) ORDER BY chart.label)
           FROM (
             SELECT DATE(p."paidAt")::text AS label, COALESCE(SUM(p.amount - p."refundedAmount"), 0) AS value
             FROM payments p
             WHERE p."deletedAt" IS NULL
               AND p.status IN ('SUCCESS', 'PARTIALLY_REFUNDED')
               AND p."paidAt" >= CURRENT_DATE - INTERVAL '6 days'
               AND p."paidAt" < CURRENT_DATE + INTERVAL '1 day'
             GROUP BY DATE(p."paidAt")
           ) chart), '[]'::jsonb) AS "revenueChart",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('label', chart.label, 'value', chart.value) ORDER BY chart.label)
           FROM (
             SELECT DATE(o."confirmedAt")::text AS label, COUNT(*) AS value
             FROM orders o
             WHERE o."deletedAt" IS NULL
               AND o."confirmedAt" >= CURRENT_DATE - INTERVAL '6 days'
               AND o."confirmedAt" < CURRENT_DATE + INTERVAL '1 day'
             GROUP BY DATE(o."confirmedAt")
           ) chart), '[]'::jsonb) AS "ordersChart",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('label', status_counts.status, 'value', status_counts.count) ORDER BY status_counts.status)
           FROM (
             SELECT o.status::text AS status, COUNT(*) AS count
             FROM orders o
             WHERE o."deletedAt" IS NULL AND o."confirmedAt" >= CURRENT_DATE AND o."confirmedAt" < CURRENT_DATE + INTERVAL '1 day'
             GROUP BY o.status
           ) status_counts), '[]'::jsonb) AS "orderBreakdown",
          COALESCE((SELECT ROUND(((today.revenue - yesterday.revenue) / NULLIF(yesterday.revenue, 0)) * 100, 2)
           FROM (
             SELECT COALESCE(SUM(cs."invoiceTotal"), 0) AS revenue
             FROM checkout_sessions cs
             WHERE cs."deletedAt" IS NULL AND cs."checkedOutAt" >= CURRENT_DATE AND cs."checkedOutAt" < CURRENT_DATE + INTERVAL '1 day'
           ) today,
           (
             SELECT COALESCE(SUM(cs."invoiceTotal"), 0) AS revenue
             FROM checkout_sessions cs
             WHERE cs."deletedAt" IS NULL AND cs."checkedOutAt" >= CURRENT_DATE - INTERVAL '1 day' AND cs."checkedOutAt" < CURRENT_DATE
           ) yesterday), 0) AS "revenueChange",
          COALESCE((SELECT ROUND(((today.count - yesterday.count)::numeric / NULLIF(yesterday.count, 0)) * 100, 2)
           FROM (
             SELECT COUNT(*) AS count FROM orders o WHERE o."deletedAt" IS NULL AND o."confirmedAt" >= CURRENT_DATE AND o."confirmedAt" < CURRENT_DATE + INTERVAL '1 day'
           ) today,
           (
             SELECT COUNT(*) AS count FROM orders o WHERE o."deletedAt" IS NULL AND o."confirmedAt" >= CURRENT_DATE - INTERVAL '1 day' AND o."confirmedAt" < CURRENT_DATE
           ) yesterday), 0) AS "ordersChange",
          COALESCE((SELECT ROUND(((today.count - yesterday.count)::numeric / NULLIF(yesterday.count, 0)) * 100, 2)
           FROM (
             SELECT COUNT(DISTINCT b."customerId") AS count FROM bookings b WHERE b."deletedAt" IS NULL AND b."bookingDate" = CURRENT_DATE
           ) today,
           (
             SELECT COUNT(DISTINCT b."customerId") AS count FROM bookings b WHERE b."deletedAt" IS NULL AND b."bookingDate" = CURRENT_DATE - INTERVAL '1 day'
           ) yesterday), 0) AS "customersChange",
          jsonb_build_object(
            'tableOccupancy', COALESCE((SELECT jsonb_object_agg(status_counts.status, status_counts.count) FROM (SELECT t.status::text, COUNT(*) AS count FROM tables t WHERE t."deletedAt" IS NULL GROUP BY t.status) status_counts), '{}'::jsonb),
            'roomOccupancy', COALESCE((SELECT jsonb_object_agg(status_counts.status, status_counts.count) FROM (SELECT r.status::text, COUNT(*) AS count FROM rooms r WHERE r."deletedAt" IS NULL GROUP BY r.status) status_counts), '{}'::jsonb),
            'pendingInvoices', (SELECT COUNT(*) FROM invoices i WHERE i."deletedAt" IS NULL AND i.status IN ('GENERATED', 'PARTIALLY_PAID') AND i."balanceAmount" > 0),
            'failedPaymentsToday', (SELECT COUNT(*) FROM payments p WHERE p."deletedAt" IS NULL AND p.status = 'FAILED' AND p."paidAt" >= CURRENT_DATE AND p."paidAt" < CURRENT_DATE + INTERVAL '1 day')
          ) AS "dashboardStatistics"
      `,
    );
  }

  async adminSystem() {
    return this.first(
      await prisma.$queryRaw<DashboardRawRow[]>`
        SELECT
          (SELECT COUNT(*) FROM users u WHERE u."deletedAt" IS NULL AND u.role <> 'CUSTOMER') AS "employeeCount",
          (SELECT COUNT(*) FROM users u WHERE u."deletedAt" IS NULL AND u.role = 'RECEPTION') AS "receptionCount",
          (SELECT COUNT(*) FROM users u WHERE u."deletedAt" IS NULL AND u.role = 'KITCHEN') AS "kitchenStaffCount",
          (SELECT COUNT(*) FROM users u WHERE u."deletedAt" IS NULL AND u.role = 'MANAGER') AS "managersCount",
          jsonb_build_object(
            'totalUsers', (SELECT COUNT(*) FROM users u WHERE u."deletedAt" IS NULL),
            'activeUsers', (SELECT COUNT(*) FROM users u WHERE u."deletedAt" IS NULL AND u.status = 'ACTIVE'),
            'inactiveUsers', (SELECT COUNT(*) FROM users u WHERE u."deletedAt" IS NULL AND u.status = 'INACTIVE'),
            'blockedUsers', (SELECT COUNT(*) FROM users u WHERE u."deletedAt" IS NULL AND u.status = 'BLOCKED')
          ) AS "userStatistics",
          jsonb_build_object('database', 'UP', 'generatedAt', NOW()) AS "databaseHealth",
          COALESCE((SELECT jsonb_object_agg(role_counts.role, role_counts.count) FROM (SELECT u.role::text, COUNT(*) AS count FROM users u WHERE u."deletedAt" IS NULL GROUP BY u.role) role_counts), '{}'::jsonb) AS "roleStatistics",
          (SELECT jsonb_build_object(
            'id', r.id,
            'name', r.name,
            'phone', r.phone,
            'email', r.email,
            'address', r.address,
            'currency', r.currency,
            'timezone', r.timezone,
            'openingTime', r."openingTime",
            'closingTime', r."closingTime",
            'gstNumber', r."gstNumber"
          ) FROM restaurants r WHERE r."deletedAt" IS NULL ORDER BY r."createdAt" ASC LIMIT 1) AS "restaurantSettingsSummary",
          jsonb_build_object(
            'averageCgstRate', COALESCE((SELECT AVG(i."cgstRate") FROM invoices i WHERE i."deletedAt" IS NULL), 0),
            'averageSgstRate', COALESCE((SELECT AVG(i."sgstRate") FROM invoices i WHERE i."deletedAt" IS NULL), 0),
            'averageIgstRate', COALESCE((SELECT AVG(i."igstRate") FROM invoices i WHERE i."deletedAt" IS NULL), 0),
            'taxCollectedThisMonth', COALESCE((SELECT SUM(i."taxTotal") FROM invoices i WHERE i."deletedAt" IS NULL AND i."generatedAt" >= date_trunc('month', NOW())), 0)
          ) AS "taxSettings",
          jsonb_build_object(
            'notificationsTotal', (SELECT COUNT(*) FROM customer_notifications n WHERE n."deletedAt" IS NULL),
            'unreadNotifications', (SELECT COUNT(*) FROM customer_notifications n WHERE n."deletedAt" IS NULL AND n."readAt" IS NULL),
            'offersActive', (SELECT COUNT(*) FROM offers o WHERE o."deletedAt" IS NULL AND o.status = 'ACTIVE' AND o."startsAt" <= NOW() AND o."endsAt" >= NOW())
          ) AS "notificationSettings",
          jsonb_build_object(
            'activeRewards', (SELECT COUNT(*) FROM game_rewards gr WHERE gr."deletedAt" IS NULL AND gr.status = 'ACTIVE' AND gr."expiresAt" > NOW()),
            'usedRewards', (SELECT COUNT(*) FROM game_rewards gr WHERE gr."deletedAt" IS NULL AND gr.status = 'USED'),
            'expiredRewards', (SELECT COUNT(*) FROM game_rewards gr WHERE gr."deletedAt" IS NULL AND (gr.status = 'EXPIRED' OR gr."expiresAt" <= NOW()))
          ) AS "gameSettings",
          jsonb_build_object(
            'rewardedCustomers', (SELECT COUNT(DISTINCT gr."customerId") FROM game_rewards gr WHERE gr."deletedAt" IS NULL),
            'totalRewardValue', COALESCE((SELECT SUM(gr."discountValue") FROM game_rewards gr WHERE gr."deletedAt" IS NULL), 0),
            'availableRewards', (SELECT COUNT(*) FROM game_rewards gr WHERE gr."deletedAt" IS NULL AND gr.status = 'ACTIVE' AND gr."expiresAt" > NOW())
          ) AS "loyaltySettings",
          COALESCE((SELECT jsonb_agg(jsonb_build_object('id', u.id, 'fullName', u."fullName", 'role', u.role, 'status', u.status, 'lastLoginAt', u."lastLoginAt", 'updatedAt', u."updatedAt") ORDER BY COALESCE(u."lastLoginAt", u."updatedAt") DESC)
           FROM (SELECT * FROM users WHERE "deletedAt" IS NULL AND role <> 'CUSTOMER' ORDER BY COALESCE("lastLoginAt", "updatedAt") DESC LIMIT 10) u), '[]'::jsonb) AS "recentEmployeeActivities",
          jsonb_build_object(
            'pendingInvoices', (SELECT COUNT(*) FROM invoices i WHERE i."deletedAt" IS NULL AND i.status IN ('GENERATED', 'PARTIALLY_PAID') AND i."balanceAmount" > 0),
            'pendingKitchenOrders', (SELECT COUNT(*) FROM kitchen_queue kq WHERE kq."deletedAt" IS NULL AND kq.status IN ('PENDING', 'ACCEPTED', 'PREPARING')),
            'failedPaymentsToday', (SELECT COUNT(*) FROM payments p WHERE p."deletedAt" IS NULL AND p.status = 'FAILED' AND p."paidAt" >= CURRENT_DATE AND p."paidAt" < CURRENT_DATE + INTERVAL '1 day')
          ) AS "systemHealth"
      `,
    );
  }

  private first(rows: DashboardRawRow[]): DashboardRawRow | null {
    return rows[0] ?? null;
  }
}
