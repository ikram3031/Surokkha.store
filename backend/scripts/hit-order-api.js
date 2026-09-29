const API_URL = "https://server.decantrebd.com/api/v1/orders/new-order";

const mockOrderPayload = {
  fullName: "IH Khan",
  email: "ihkhan2027@gmail.com",
  phone: "01712345678",
  address: "House 45, Road 11, Sector 4",
  district: "Dhaka",
  shippingFee: 100,
  subtotal: 1850,
  totalAmount: 1950,
  paymentMethod: "Cash on Delivery (COD)",
  items: [
    {
      productId: "66b579f18a24d5b9423c56a1",
      name: "Sauvage Elixir Eau De Parfum",
      variant: "10ml Decant",
      quantity: 1,
      price: 1850,
      subtotal: 1850
    }
  ]
};

async function createOrder() {
  console.log(`🚀 Sending POST request to ${API_URL}...`);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockOrderPayload)
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("✅ Order created successfully! Emails should be dispatched.");
    } else {
      console.error("❌ Failed to create order.");
    }
  } catch (error) {
    console.error("❌ Error making API call:", error);
  }
}

createOrder();
