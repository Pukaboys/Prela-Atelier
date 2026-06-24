from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


OUTPUT = "prela-atelier-thesis-diagrams.pdf"
PAGE_W, PAGE_H = landscape(A4)


def wrap(text, width, font="Helvetica", size=8):
    words = text.split()
    lines = []
    line = ""
    for word in words:
        next_line = f"{line} {word}".strip()
        if stringWidth(next_line, font, size) <= width:
            line = next_line
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def title(c, text):
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(colors.HexColor("#1a1713"))
    c.drawString(36, PAGE_H - 42, text)
    c.setStrokeColor(colors.HexColor("#b08d57"))
    c.line(36, PAGE_H - 50, PAGE_W - 36, PAGE_H - 50)


def explanation(c, text):
    styles = getSampleStyleSheet()
    style = styles["BodyText"]
    style.fontName = "Helvetica"
    style.fontSize = 9
    style.leading = 12
    p = Paragraph(text, style)
    p.wrapOn(c, PAGE_W - 72, 50)
    p.drawOn(c, 36, 20)


def box(c, x, y, w, h, text, fill="#ffffff", stroke="#8b7b61", size=8):
    c.setFillColor(colors.HexColor(fill))
    c.setStrokeColor(colors.HexColor(stroke))
    c.roundRect(x, y, w, h, 6, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#1a1713"))
    c.setFont("Helvetica", size)
    lines = wrap(text, w - 12, size=size)
    total_h = len(lines) * (size + 2)
    start_y = y + h / 2 + total_h / 2 - size
    for i, line in enumerate(lines):
        tw = stringWidth(line, "Helvetica", size)
        c.drawString(x + (w - tw) / 2, start_y - i * (size + 2), line)


def arrow(c, x1, y1, x2, y2, color="#7a6a55"):
    c.setStrokeColor(colors.HexColor(color))
    c.setLineWidth(1)
    c.line(x1, y1, x2, y2)
    dx = x2 - x1
    dy = y2 - y1
    if abs(dx) >= abs(dy):
        sign = 1 if dx >= 0 else -1
        c.line(x2, y2, x2 - sign * 7, y2 + 4)
        c.line(x2, y2, x2 - sign * 7, y2 - 4)
    else:
        sign = 1 if dy >= 0 else -1
        c.line(x2, y2, x2 + 4, y2 - sign * 7)
        c.line(x2, y2, x2 - 4, y2 - sign * 7)


def use_case_page(c):
    title(c, "1. Use Case Diagram")
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 78, "Prela Atelier Platform")
    c.setStrokeColor(colors.HexColor("#d8c8aa"))
    c.roundRect(155, 88, 530, 390, 10, fill=0, stroke=1)

    actors = {
        "Customer": (42, 390),
        "Admin": (42, 265),
        "Production Staff": (700, 340),
        "Manager": (700, 220),
    }
    for name, (x, y) in actors.items():
        box(c, x, y, 100, 38, name, fill="#f7f1e8", stroke="#b08d57", size=9)

    use_cases = [
        ("Browse products", 185, 420), ("Add to cart", 330, 420), ("Checkout order", 475, 420),
        ("Request custom quote", 185, 350), ("Submit enquiry", 330, 350), ("Track order", 475, 350),
        ("Manage catalogue", 185, 260), ("Manage orders", 330, 260), ("Manage enquiries", 475, 260),
        ("Update production", 330, 170), ("View analytics", 475, 170), ("Manage settings", 185, 170),
    ]
    for text, x, y in use_cases:
        box(c, x, y, 115, 38, text, fill="#ffffff", stroke="#b8aa91", size=8)

    for x, y in [(185, 439), (330, 439), (475, 439), (185, 369), (330, 369), (475, 369)]:
        arrow(c, 142, 409, x, y)
    for x, y in [(185, 279), (330, 279), (475, 279), (185, 189)]:
        arrow(c, 142, 284, x, y)
    for x, y in [(330, 189), (330, 279)]:
        arrow(c, 700, 359, x + 115, y)
    for x, y in [(475, 189), (330, 279)]:
        arrow(c, 700, 239, x + 115, y)

    explanation(
        c,
        "The use case diagram identifies the main actors and their interactions with the platform. "
        "Customers use the public commerce functions, administrators maintain operational data, "
        "production staff update manufacturing progress, and managers use analytics for business decisions.",
    )
    c.showPage()


def workflow_page(c):
    title(c, "2. Order and Production Workflow Diagram")
    steps = [
        "Customer browses products",
        "Adds product to cart",
        "Checkout form submitted",
        "Server-side validation",
        "Recalculate prices, shipping and promo",
        "Check inventory availability",
        "Create order and order items in transaction",
        "Send bank transfer and admin emails",
        "Admin confirms order",
        "Deduct inventory",
        "Design",
        "Material selection",
        "Cutting",
        "Finishing",
        "Quality check",
        "Ready, shipped and delivered",
    ]
    x = 285
    y = PAGE_H - 92
    w = 270
    h = 26
    for i, step in enumerate(steps):
        fill = "#f7f1e8" if i < 10 else "#ffffff"
        box(c, x, y, w, h, step, fill=fill, stroke="#b08d57" if i in [3, 6, 9] else "#b8aa91", size=8)
        if i < len(steps) - 1:
            arrow(c, x + w / 2, y, x + w / 2, y - 18)
        y -= 44

    box(c, 590, PAGE_H - 248, 150, 34, "Invalid data: return validation error", fill="#fff7f2", stroke="#cc7a59", size=8)
    arrow(c, 555, PAGE_H - 184, 590, PAGE_H - 231)
    box(c, 590, PAGE_H - 338, 150, 34, "Insufficient stock: return inventory error", fill="#fff7f2", stroke="#cc7a59", size=8)
    arrow(c, 555, PAGE_H - 272, 590, PAGE_H - 321)

    explanation(
        c,
        "The workflow diagram shows the movement from public checkout to internal production handling. "
        "The implementation validates all checkout data, recalculates totals on the server, verifies inventory, "
        "stores orders transactionally, and then supports staged production tracking until delivery.",
    )
    c.showPage()


def architecture_page(c):
    title(c, "3. System Architecture Diagram")
    layers = [
        ("Client Layer", ["Next.js Web Frontend", "Expo Mobile App", "Admin Dashboard UI"], 430),
        ("Application Layer", ["Public Server Components", "Next.js API Routes", "Admin Middleware"], 330),
        ("Service Layer", ["Order Service", "Inventory Service", "Custom Order Service", "Dashboard Analytics", "Recommendation Service"], 220),
        ("Data Layer", ["Prisma ORM", "PostgreSQL Database", "Iron Session"], 120),
    ]
    for layer_name, nodes, y in layers:
        c.setFillColor(colors.HexColor("#1a1713"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(54, y + 48, layer_name)
        start_x = 165
        gap = 14
        node_w = min(120, (PAGE_W - 220 - gap * (len(nodes) - 1)) / len(nodes))
        for i, node in enumerate(nodes):
            box(c, start_x + i * (node_w + gap), y + 30, node_w, 34, node, fill="#ffffff", stroke="#b8aa91", size=7)
        if y > 120:
            arrow(c, PAGE_W / 2, y + 30, PAGE_W / 2, y - 6)

    external = [("Email/SMTP", 620, 295), ("Stripe", 720, 295), ("PayPal", 620, 245), ("Analytics", 720, 245), ("Blob Images", 670, 195)]
    c.setFont("Helvetica-Bold", 10)
    c.drawString(640, 355, "External Services")
    for text, x, y in external:
        box(c, x, y, 82, 30, text, fill="#f7f1e8", stroke="#b08d57", size=7)
        arrow(c, 560, 248, x, y + 15)

    explanation(
        c,
        "The architecture diagram presents the platform as a layered system. Public pages, admin pages, and the mobile app use shared API routes and services. "
        "The service layer centralizes business logic, Prisma provides database access, and external providers support payments, email, analytics, and image storage.",
    )
    c.showPage()


def er_box(c, title_text, fields, x, y, w=150):
    h = 22 + len(fields) * 14
    c.setFillColor(colors.HexColor("#f7f1e8"))
    c.setStrokeColor(colors.HexColor("#b08d57"))
    c.roundRect(x, y, w, h, 5, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#1a1713"))
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(x + w / 2, y + h - 15, title_text)
    c.setFont("Helvetica", 7)
    for i, field in enumerate(fields):
        c.drawString(x + 8, y + h - 31 - i * 14, field)
    return (x, y, w, h)


def er_page(c):
    title(c, "4. Simplified ER Diagram")
    product = er_box(c, "PRODUCT", ["id PK", "name", "slug UK", "priceEur", "stock", "materialId FK"], 60, 330)
    material = er_box(c, "MATERIAL", ["id PK", "name", "origin", "description", "pricePerM2Eur", "visible"], 60, 140)
    image = er_box(c, "PRODUCT_IMAGE", ["id PK", "productId FK", "url", "sortOrder"], 260, 365)
    order = er_box(c, "ORDER", ["id PK", "orderCode UK", "customerEmail", "subtotal", "shipping", "total", "status"], 455, 325)
    item = er_box(c, "ORDER_ITEM", ["id PK", "orderId FK", "productId FK", "name", "quantity", "subtotal"], 285, 170)
    enquiry = er_box(c, "BESPOKE_ENQUIRY", ["id PK", "name", "email", "type", "budget", "description", "status"], 620, 165)
    promo = er_box(c, "PROMO_CODE", ["id PK", "code UK", "type", "value", "minOrder", "usedCount", "active"], 620, 350)
    setting = er_box(c, "SETTING", ["key PK", "value", "updatedAt"], 455, 105)

    arrow(c, material[0] + material[2] / 2, material[1] + material[3], product[0] + product[2] / 2, product[1])
    c.drawString(104, 292, "1 material to many products")
    arrow(c, product[0] + product[2], product[1] + 65, image[0], image[1] + 45)
    c.drawString(207, 430, "1 to many")
    arrow(c, order[0], order[1] + 45, item[0] + item[2], item[1] + 45)
    c.drawString(385, 260, "contains")
    arrow(c, product[0] + product[2], product[1] + 25, item[0], item[1] + 45)
    c.drawString(200, 285, "ordered as")

    c.setFont("Helvetica", 8)
    c.drawString(enquiry[0], enquiry[1] - 18, "Custom requests stored separately from standard orders")
    c.drawString(promo[0], promo[1] - 18, "Discount configuration")
    c.drawString(setting[0], setting[1] - 18, "Global business settings")

    explanation(
        c,
        "The ER diagram summarizes the main Prisma models. Products are connected to materials and images. Orders contain multiple order items, and each item references a product. "
        "Bespoke enquiries are stored separately because they represent custom requests rather than normal checkout orders.",
    )
    c.showPage()


def main():
    c = canvas.Canvas(OUTPUT, pagesize=landscape(A4))
    c.setTitle("Prela Atelier Thesis Diagrams")
    use_case_page(c)
    workflow_page(c)
    architecture_page(c)
    er_page(c)
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    main()
