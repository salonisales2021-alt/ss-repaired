
# Saloni Sales Portal: Demo Walkthrough Guide

This guide details how to navigate the application and test all key features using the built-in **`DEV_DEMO_MODE`** widget.

## 🚀 Quick Start
Look for the **"DEV_DEMO_MODE"** button in the bottom-left corner of the screen. Click it to open the Role Switcher.

---

## 🏗 Scenario 1: The "Dispatch" Restrictions
*Objective: Verify that the Dispatch team has limited access.*

1.  Open Demo Widget -> Click **"🚚 Dispatch Dept"**.
2.  You will be redirected to `/admin/dashboard`.
3.  **Observation:**
    *   The Sidebar is significantly shorter (Dashboard, Orders, Inventory, Support).
    *   **Finance, Marketing, Reports** are missing.
    *   The Main Dashboard hides "Revenue" cards and shows "Orders Ready for Dispatch".
4.  Try accessing `/admin/finance` manually in the URL bar -> You should be redirected or shown a "Not Found/Restricted" page.

---

## 👔 Scenario 2: Biometric Login
*Objective: Set up and use FaceID/TouchID logic.*

1.  Open Demo Widget -> Click **"🛍️ Retailer"** (Priya Sharma).
2.  Go to **Profile** (Top Right Menu -> Account -> Profile).
3.  Under "Device Security", toggle **"Biometric Login"** ON.
4.  Logout (Top Right -> Logout).
5.  On the Login Screen, you will now see a **"🙂 Login with FaceID"** button.
6.  Click it to simulate a biometric scan and log in instantly without a password.

---

## 👗 Scenario 3: The Retailer Journey (AI Features)
*Objective: Test the shopping experience and AI tools.*

1.  **Visual Scout (AI Search):**
    *   Go to **Account -> AI Visual Scout**.
    *   Upload any dress image.
    *   *Result:* Gemini AI analyzes the image (color, fabric, style) and filters the catalog to find matching products.

2.  **Smart Stocker (AI Planning):**
    *   Go to **Account -> Smart Stocker**.
    *   Set Budget: ₹50,000. Location: "Mumbai". Type: "Premium Boutique".
    *   Click "Plan My Stock".
    *   *Result:* Gemini AI generates a curated bundle of products fitting that budget and demographic.

3.  **Price Negotiation:**
    *   Add items to Cart (e.g., 50 sets via Quick Order).
    *   Go to **Cart**.
    *   Click **"Negotiate Rate"**.
    *   *Interaction:* Chat with the AI bot. Ask for a discount. It will offer up to 3% but restrict payment to "Pay Now".

---

## 🎬 Scenario 4: Creative Tools (Admin/Customer)
*Objective: Generate marketing assets.*

1.  **Design Studio:**
    *   Go to **Account -> Custom Studio**.
    *   Select a product. Enter prompt: "Change color to pastel pink and add a bow".
    *   Click **Generate**.
    *   *Result:* AI generates a modified image of the dress.

2.  **Marketing Kit:**
    *   Go to **Orders** -> Select an Order -> Click **"Create Marketing Kit"**.
    *   Set Profit Margin (e.g., 40%). Tone: "Fun".
    *   Click **Generate**.
    *   *Result:* AI writes Instagram Captions and WhatsApp messages for you to resell these items.

---

## 🔊 Scenario 5: Live Voice Agent
*Objective: Test real-time voice commerce.*

1.  Click the microphone icon (bottom right) or "Talk to Sales".
2.  Allow Microphone permissions.
3.  **Speak:** "I need red frocks for 5 year olds."
4.  *Result:* The AI will search the catalog and respond verbally. You can say "Add 2 sets to cart" to perform actions.

---

## 🚛 Scenario 6: The Gaddi Logistics Flow
*Objective: Understand the credit/ledger system.*

1.  **As Retailer:**
    *   Go to Cart.
    *   Select Payment: **"Bill to J M Jain Gaddi"** (Credit).
    *   Place Order.
2.  **Switch Role:** Open Demo Widget -> Click **"🏛️ Gaddi Firm"**.
3.  You are now the Gaddi Partner.
4.  You see the "Trade Approvals" dashboard.
5.  Click **"✅ Approve Settlement"** on the retailer's order.
6.  *Result:* The order moves from PENDING to ACCEPTED in the Factory system because the Gaddi took responsibility.

---

## 🛠 Admin Power Tools
1.  **AI Bulk Onboarding:** Admin -> Bulk Onboarding -> Upload 5 dress photos -> AI extracts details (Color, Pattern) automatically.
2.  **Market Trends:** Admin -> Trends -> Ask "What colors are trending for Diwali 2025?" -> AI searches Google Live Data.
