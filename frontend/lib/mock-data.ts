import type {
  Restaurant,
  Table,
  MenuItem,
} from "./types/restaurant.types"

// ============================================================================
// MOCK DATA
// ============================================================================
//
// TEMPORARY:
// These values are used while Restaurant Service is not connected.
//
// LATER:
// This entire file can be deleted when Restaurant API is connected.
//
// Keep IDs stable while using mocks because Reservations mock references:
//   - restaurantId
//   - tableGroupId
//   - menuItemId
//
// Prices are expressed in RSD to match the future backend/payment flow.
// ============================================================================


// ============================================================================
// RESTAURANTS
// ============================================================================

export const mockRestaurants: Restaurant[] = [
  {
    id: 1,
    name: "Pizza Palace",
    description:
      "Authentic Italian pizza, pasta and fresh Mediterranean ingredients.",
    city: "Belgrade",
    address: "Knez Mihailova 12",
    phone_number: "+381 64 123 45 67",

    opening_time: "10:00",
    closing_time: "22:00",

    rating: 4.5,
    price_range: "$$",
    cuisine_type: "Italian",

    reservation_duration: "03:00:00",

    image: "",
  },

  {
    id: 2,
    name: "Sushi Spot",
    description:
      "Fresh sushi, sashimi and Japanese dishes prepared by experienced chefs.",
    city: "Novi Sad",
    address: "Zmaj Jovina 45",
    phone_number: "+381 63 987 65 43",

    opening_time: "11:00",
    closing_time: "21:00",

    rating: 4.8,
    price_range: "$$$",
    cuisine_type: "Japanese",

    reservation_duration: "03:00:00",

    image: "",
  },

  {
    id: 3,
    name: "Balkan Bistro",
    description:
      "Traditional Balkan cuisine served in a relaxed and cozy atmosphere.",
    city: "Belgrade",
    address: "Kralja Petra 8",
    phone_number: "+381 65 555 44 33",

    opening_time: "09:00",
    closing_time: "23:00",

    rating: 4.2,
    price_range: "$$",
    cuisine_type: "Balkan",

    reservation_duration: "03:00:00",

    image: "",
  },

  {
    id: 4,
    name: "Le Gourmet",
    description:
      "Fine dining French cuisine with carefully selected seasonal ingredients.",
    city: "Novi Sad",
    address: "Bulevar Oslobođenja 15",
    phone_number: "+381 62 112 22 33",

    opening_time: "12:00",
    closing_time: "23:00",

    rating: 4.9,
    price_range: "$$$",
    cuisine_type: "French",

    reservation_duration: "03:00:00",

    image: "",
  },

  {
    id: 5,
    name: "Mediterraneo",
    description:
      "Mediterranean cuisine with seafood, fresh vegetables and modern flavors.",
    city: "Belgrade",
    address: "Njegoševa 20",
    phone_number: "+381 64 777 88 99",

    opening_time: "10:00",
    closing_time: "22:30",

    rating: 4.6,
    price_range: "$$$",
    cuisine_type: "Mediterranean",

    reservation_duration: "03:00:00",

    image: "",
  },
]


// ============================================================================
// TABLE GROUPS
// ============================================================================
//
// These represent the same concept as tableGroupId in Reservations Service.
//
// Example:
//
// tableGroupId = 1
// location     = Inside
// seats        = 2
//
// available_number is currently mock Restaurant Service data.
// Reservations Service will later determine actual availability together
// with existing reservations.
// ============================================================================

export const mockTables: Table[] = [
  // Pizza Palace
  {
    id: 1,
    restaurantId: 1,
    location: "Inside",
    seats: 2,
    available_number: 2,
  },
  {
    id: 2,
    restaurantId: 1,
    location: "Inside",
    seats: 4,
    available_number: 3,
  },
  {
    id: 3,
    restaurantId: 1,
    location: "Outside",
    seats: 6,
    available_number: 2,
  },

  // Sushi Spot
  {
    id: 4,
    restaurantId: 2,
    location: "Inside",
    seats: 2,
    available_number: 2,
  },
  {
    id: 5,
    restaurantId: 2,
    location: "Inside",
    seats: 4,
    available_number: 3,
  },
  {
    id: 6,
    restaurantId: 2,
    location: "Outside",
    seats: 6,
    available_number: 2,
  },

  // Balkan Bistro
  {
    id: 7,
    restaurantId: 3,
    location: "Inside",
    seats: 2,
    available_number: 2,
  },
  {
    id: 8,
    restaurantId: 3,
    location: "Inside",
    seats: 4,
    available_number: 3,
  },
  {
    id: 9,
    restaurantId: 3,
    location: "Outside",
    seats: 6,
    available_number: 2,
  },

  // Le Gourmet
  {
    id: 10,
    restaurantId: 4,
    location: "Inside",
    seats: 2,
    available_number: 3,
  },
  {
    id: 11,
    restaurantId: 4,
    location: "Inside",
    seats: 4,
    available_number: 2,
  },
  {
    id: 12,
    restaurantId: 4,
    location: "Terrace",
    seats: 4,
    available_number: 2,
  },

  // Mediterraneo
  {
    id: 13,
    restaurantId: 5,
    location: "Inside",
    seats: 2,
    available_number: 3,
  },
  {
    id: 14,
    restaurantId: 5,
    location: "Inside",
    seats: 4,
    available_number: 3,
  },
  {
    id: 15,
    restaurantId: 5,
    location: "Terrace",
    seats: 6,
    available_number: 2,
  },
]


// ============================================================================
// MENU ITEMS
// ============================================================================
//
// IMPORTANT:
//
// price is currently expressed in RSD.
//
// Reservations mock will copy:
//   foodName
//   price
//   quantity
//
// into OrderResponse.
//
// Later Reservations Service gets these values from Restaurant Service.
// ============================================================================

export const mockMenuItems: MenuItem[] = [
  // --------------------------------------------------------------------------
  // Pizza Palace
  // --------------------------------------------------------------------------

  {
    id: 1,
    restaurant_id: 1,
    food_name: "Margherita Pizza",
    description:
      "Classic pizza with tomato, mozzarella and basil.",
    price: 890,
    image: "",
    category: "main",
  },

  {
    id: 2,
    restaurant_id: 1,
    food_name: "Caesar Salad",
    description:
      "Romaine lettuce, croutons, parmesan and Caesar dressing.",
    price: 690,
    image: "",
    category: "appetizer",
  },

  {
    id: 3,
    restaurant_id: 1,
    food_name: "Spaghetti Carbonara",
    description:
      "Pasta with eggs, parmesan, pancetta and black pepper.",
    price: 990,
    image: "",
    category: "main",
  },


  // --------------------------------------------------------------------------
  // Sushi Spot
  // --------------------------------------------------------------------------

  {
    id: 4,
    restaurant_id: 2,
    food_name: "Sushi Platter",
    description:
      "Selection of nigiri, maki and uramaki rolls.",
    price: 1850,
    image: "",
    category: "main",
  },

  {
    id: 5,
    restaurant_id: 2,
    food_name: "Miso Soup",
    description:
      "Traditional Japanese soup with tofu, seaweed and spring onion.",
    price: 450,
    image: "",
    category: "appetizer",
  },

  {
    id: 6,
    restaurant_id: 2,
    food_name: "Salmon Nigiri",
    description:
      "Fresh salmon served over seasoned sushi rice.",
    price: 950,
    image: "",
    category: "main",
  },


  // --------------------------------------------------------------------------
  // Balkan Bistro
  // --------------------------------------------------------------------------

  {
    id: 7,
    restaurant_id: 3,
    food_name: "Ćevapi",
    description:
      "Grilled minced meat served with onion, kajmak and flatbread.",
    price: 950,
    image: "",
    category: "main",
  },

  {
    id: 8,
    restaurant_id: 3,
    food_name: "Shopska Salad",
    description:
      "Tomato, cucumber, pepper, onion and grated white cheese.",
    price: 520,
    image: "",
    category: "appetizer",
  },

  {
    id: 9,
    restaurant_id: 3,
    food_name: "Karađorđeva Schnitzel",
    description:
      "Breaded rolled veal filled with kajmak and served with potatoes.",
    price: 1450,
    image: "",
    category: "main",
  },


  // --------------------------------------------------------------------------
  // Le Gourmet
  // --------------------------------------------------------------------------

  {
    id: 10,
    restaurant_id: 4,
    food_name: "French Onion Soup",
    description:
      "Slow-cooked onion soup with toasted bread and melted cheese.",
    price: 790,
    image: "",
    category: "appetizer",
  },

  {
    id: 11,
    restaurant_id: 4,
    food_name: "Duck Confit",
    description:
      "Slow-cooked duck leg with potato purée and seasonal vegetables.",
    price: 2450,
    image: "",
    category: "main",
  },

  {
    id: 12,
    restaurant_id: 4,
    food_name: "Crème Brûlée",
    description:
      "Classic vanilla custard with caramelized sugar crust.",
    price: 720,
    image: "",
    category: "dessert",
  },


  // --------------------------------------------------------------------------
  // Mediterraneo
  // --------------------------------------------------------------------------

  {
    id: 13,
    restaurant_id: 5,
    food_name: "Grilled Sea Bass",
    description:
      "Sea bass with grilled vegetables, olive oil and lemon.",
    price: 2100,
    image: "",
    category: "main",
  },

  {
    id: 14,
    restaurant_id: 5,
    food_name: "Greek Salad",
    description:
      "Tomato, cucumber, olives, red onion and feta cheese.",
    price: 690,
    image: "",
    category: "appetizer",
  },

  {
    id: 15,
    restaurant_id: 5,
    food_name: "Seafood Risotto",
    description:
      "Creamy risotto with shrimp, mussels and Mediterranean herbs.",
    price: 1750,
    image: "",
    category: "main",
  },

  {
    id: 16,
    restaurant_id: 1,
    food_name: "Sparkling Water",
    description: "Chilled sparkling mineral water.",
    price: 280,
    image: "",
    category: "drinks",
  },
  {
    id: 17,
    restaurant_id: 2,
    food_name: "Green Tea",
    description: "Traditional Japanese green tea.",
    price: 320,
    image: "",
    category: "drinks",
  },
  {
    id: 18,
    restaurant_id: 3,
    food_name: "Homemade Lemonade",
    description: "Fresh homemade lemonade.",
    price: 350,
    image: "",
    category: "drinks",
  },
  {
    id: 19,
    restaurant_id: 4,
    food_name: "Still Water",
    description: "Chilled still mineral water.",
    price: 300,
    image: "",
    category: "drinks",
  },
  {
    id: 20,
    restaurant_id: 5,
    food_name: "Fresh Orange Juice",
    description: "Freshly squeezed orange juice.",
    price: 490,
    image: "",
    category: "drinks",
  },

  {
    id: 21,
    restaurant_id: 1,
    food_name: "Tiramisu",
    description:
      "Classic Italian dessert with mascarpone, coffee and cocoa.",
    price: 590,
    image: "",
    category: "dessert",
  },

  {
    id: 22,
    restaurant_id: 2,
    food_name: "Mochi Ice Cream",
    description:
      "Soft rice dough filled with creamy ice cream.",
    price: 650,
    image: "",
    category: "dessert",
  },

  {
    id: 23,
    restaurant_id: 3,
    food_name: "Baklava",
    description:
      "Layered pastry with walnuts, honey and aromatic syrup.",
    price: 490,
    image: "",
    category: "dessert",
  },

  {
    id: 24,
    restaurant_id: 5,
    food_name: "Panna Cotta",
    description:
      "Creamy vanilla panna cotta with seasonal fruit.",
    price: 620,
    image: "",
    category: "dessert",
  },
]


// ============================================================================
// AVAILABLE RESERVATION SLOTS
// ============================================================================
//
// TEMPORARY MOCK.
//
// LATER:
//
// Replace this with:
//
// GET /api/reservations/available-slots
//
// or whatever final Reservations API endpoint contract is.
//
// Restaurant opening hours and existing reservations will determine
// the actual available slots.
// ============================================================================

export const mockAvailableSlots: Record<
  number,
  string[]
> = {
  1: [
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
  ],

  2: [
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
  ],

  3: [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
  ],

  4: [
    "12:00",
    "12:30",
    "13:00",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
  ],

  5: [
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
  ],
}