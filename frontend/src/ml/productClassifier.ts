import * as tf from '@tensorflow/tfjs';
export const categories = [
    "Computers & Laptops",
    "Mobile Phones & Accessories",
    "Networking Equipment",
    "Printers & Peripherals",
    "Consumer Electronics",
    "Cameras & Photography",
    "Sportswear",
    "Casual Clothing",
    "Formal Clothing",
    "Footwear",
    "Accessories & Bags",
    "Nutritional Supplements",
    "Medical Devices",
    "Personal Care",
    "Packaged Food",
    "Beverages",
    "Fresh Produce",
    "Furniture",
    "Office Supplies",
    "Kitchen & Dining",
    "Home Appliances",
    "Machinery & Equipment",
    "Hand Tools",
    "Electrical Components",
    "Construction Materials",
    "Fitness Equipment",
    "Outdoor Gear",
    "Sports Accessories",
    "Car Accessories",
    "Motorcycle Accessories",
    "Spare Parts",
    "Books",
    "Music & Instruments",
    "Movies & Video Games",
    "Toys & Games",
    "Arts & Crafts",
    "Pet Supplies",
    "Other"
];


const initialData = [
    // Electronics & IT
    { name: "Dell XPS 13", category: "Computers & Laptops" },
    { name: "MacBook Pro 16", category: "Computers & Laptops" },
    { name: "iPhone 15", category: "Mobile Phones & Accessories" },
    { name: "Samsung Galaxy S23", category: "Mobile Phones & Accessories" },
    { name: "TP-Link WiFi Router", category: "Networking Equipment" },
    { name: "Canon EOS R5", category: "Cameras & Photography" },
    { name: "HP LaserJet Printer", category: "Printers & Peripherals" },
    { name: "Sony WH-1000XM5", category: "Consumer Electronics" },

    // Sportswear & Apparel
    { name: "Nike Running Shoes", category: "Sportswear" },
    { name: "Adidas T-Shirt", category: "Sportswear" },
    { name: "Levi's Jeans", category: "Casual Clothing" },
    { name: "Formal Suit Jacket", category: "Formal Clothing" },
    { name: "Puma Sneakers", category: "Footwear" },
    { name: "Leather Belt", category: "Accessories & Bags" },

    // Health & Supplements
    { name: "Whey Protein 1kg", category: "Nutritional Supplements" },
    { name: "Vitamin C Tablets", category: "Nutritional Supplements" },
    { name: "Blood Pressure Monitor", category: "Medical Devices" },
    { name: "Electric Toothbrush", category: "Personal Care" },

    // Food & Beverages
    { name: "Coca-Cola 1.5L", category: "Beverages" },
    { name: "Organic Oats", category: "Packaged Food" },
    { name: "Fresh Apples", category: "Fresh Produce" },

    // Home & Office
    { name: "Office Chair", category: "Furniture" },
    { name: "Wooden Desk", category: "Furniture" },
    { name: "Ballpoint Pens Pack", category: "Office Supplies" },
    { name: "Microwave Oven", category: "Home Appliances" },
    { name: "Dinner Set 24pcs", category: "Kitchen & Dining" },

    // Industrial & Tools
    { name: "Electric Drill", category: "Hand Tools" },
    { name: "Industrial Generator", category: "Machinery & Equipment" },
    { name: "Copper Wires 10m", category: "Electrical Components" },
    { name: "Cement Bags", category: "Construction Materials" },

    // Sports & Fitness
    { name: "Treadmill 2000W", category: "Fitness Equipment" },
    { name: "Yoga Mat", category: "Sports Accessories" },
    { name: "Camping Tent 4-person", category: "Outdoor Gear" },

    // Automotive
    { name: "Car Floor Mats", category: "Car Accessories" },
    { name: "Motorcycle Helmet", category: "Motorcycle Accessories" },
    { name: "Brake Pads Set", category: "Spare Parts" },

    // Books & Media
    { name: "Harry Potter Book Set", category: "Books" },
    { name: "Acoustic Guitar Yamaha", category: "Music & Instruments" },
    { name: "The Batman DVD", category: "Movies & Video Games" },

    // Miscellaneous
    { name: "Lego Star Wars Set", category: "Toys & Games" },
    { name: "Oil Painting Canvas", category: "Arts & Crafts" },
    { name: "Cat Food 2kg", category: "Pet Supplies" },
    { name: "Miscellaneous Item", category: "Other" },
]; export const vocabulary = [
    // Brands (electronics, clothing, supplements, home)
    "nike", "adidas", "puma", "reebok", "apple", "samsung", "dell", "hp", "lenovo", "canon",
    "sony", "yamaha", "logitech", "bosch", "philips", "acer", "asus", "garmin", "fitbit",
    "michelin", "lego", "tommy", "ralph", "lauren", "levis", "gucci", "prada", "zara", "hm",

    // Electronics & IT
    "laptop", "macbook", "xps", "notebook", "iphone", "galaxy", "tablet", "monitor", "printer",
    "camera", "dslr", "headphones", "speaker", "wireless", "charger", "keyboard", "mouse",
    "router", "ssd", "harddrive", "smartwatch", "gaming", "console",

    // Sports & Apparel
    "shoes", "tshirt", "shirt", "jeans", "jacket", "shorts", "socks", "belt", "cap", "sneakers",
    "hoodie", "sweater", "sportswear", "fitness", "yoga", "treadmill", "dumbbell", "mat", "helmet",

    // Supplements & Health
    "protein", "whey", "vitamin", "capsules", "tablet", "creatine", "omega", "supplement", "nutrition",
    "energy", "bar", "shake", "health", "monitor", "blood", "pressure", "glucose", "thermometer",
    "toothbrush", "skincare", "cream", "soap", "lotion",

    // Food & Beverages
    "organic", "milk", "juice", "coca-cola", "pepsi", "water", "coffee", "tea", "beer", "wine",
    "chocolate", "snacks", "cereal", "bread", "apple", "banana", "chicken", "beef", "pork", "rice",

    // Home & Office
    "chair", "desk", "table", "lamp", "sofa", "couch", "bed", "mattress", "cabinet", "drawer",
    "shelf", "kitchen", "dining", "microwave", "oven", "fridge", "appliance", "pen", "notebook", "stapler",

    // Automotive & Tools
    "car", "motorcycle", "bike", "brake", "helmet", "mats", "tire", "wheel", "drill", "generator", "wire",
    "hammer", "screwdriver", "wrench", "tool", "construction", "cement", "paint",

    // Misc & Media
    "book", "dvd", "movie", "guitar", "piano", "lego", "toy", "game", "pet", "canvas", "painting", "arts", "crafts"
];


function encodeText(text: string) {
    const words = text.toLowerCase().split(/\W+/);
    return vocabulary.map(word => (words.includes(word) ? 1 : 0));
}


function encodeLabel(label: string) {
    const arr = Array(categories.length).fill(0);
    arr[categories.indexOf(label)] = 1;
    return arr;
}


let model: tf.Sequential | null = null;


export async function trainModel() {
    if (!model) {
        const xs = tf.tensor2d(initialData.map(d => encodeText(d.name)));
        const ys = tf.tensor2d(initialData.map(d => encodeLabel(d.category)));
        const inputLength = vocabulary.length; 
        model = tf.sequential();
        model.add(tf.layers.dense({ inputShape: [inputLength], units: 64, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
        model.add(tf.layers.dense({ units: categories.length, activation: 'softmax' }));
        model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

        await model.fit(xs, ys, { epochs: 150, batchSize: 8 });
        console.log("✅ Product classifier trained in browser!");
    }
    return model;
}


export async function predictCategory(productName: string) {
    if (!model) await trainModel();
    const tensor = tf.tensor2d([encodeText(productName)]);
    const prediction = model!.predict(tensor) as tf.Tensor;
    const idx = prediction.argMax(-1).dataSync()[0];
    return categories[idx];
}