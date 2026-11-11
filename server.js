const express = require('express');
const app = express();

app.use(express.json());

// Inventory database / valid items list
const INVENTORY = ['laser cutter', '3D printer'];

app.post('/webhook', (req, res) => {
  // 1. Safety check: Prevent server crash if request body is missing
  if (!req.body || !req.body.queryResult) {
    return res.status(400).json({ fulfillmentText: "Invalid request payload." });
  }

  const queryResult = req.body.queryResult;
  const intentName = queryResult.intent?.displayName;
  const requestedItem = queryResult.parameters?.['booking_item'];

  if (intentName === 'Book_Item') {
    const item = requestedItem ? requestedItem.toLowerCase().trim() : '';

    // Check if item exists in inventory
    if (!item || !INVENTORY.includes(item)) {
      // Clear parameter in output contexts so slot-filling prompts again
      const contexts = queryResult.outputContexts || [];
      contexts.forEach(c => {
        if (c.parameters && c.parameters['booking_item'] !== undefined) {
          c.parameters['booking_item'] = '';
        }
      });

      return res.json({
        fulfillmentMessages: [
          {
            text: {
              // 2. Fixed text to match your actual INVENTORY array
              text: ["Sorry, that item is not available. Please choose a valid item (Laser Cutter or 3D Printer)."]
            }
          }
        ],
        outputContexts: contexts
      });
    }

    // Item is valid — confirm and proceed
    return res.json({
      fulfillmentText: `Great, ${requestedItem} is available! What date would you like to reserve it?`
    });
  }

  // 3. Fallback response for unhandled intents
  return res.json({
    fulfillmentText: "Webhook received, but intent is not recognized."
  });
});

// 4. CRITICAL FOR RENDER: Use process.env.PORT with fallback to 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook running on port ${PORT}`));