const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ---------- MongoDB Connection ----------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ---------- Product Model ----------
const productSchema = new mongoose.Schema({
  name: String, sku: String, category: String, price: Number, salePrice: Number,
  description: String, status: { type: String, default: 'Published' },
  kitBuilder: { type: Boolean, default: false },
  sizes: [{ size: String, stock: Number }],
  colors: [String],
  images: [String],
  rating: Number, badge: String
}, { timestamps: true });
const Product = mongoose.model('Product', productSchema);

// ---------- Review Model ----------
const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String, email: String, rating: Number, title: String, text: String,
  verified: { type: Boolean, default: false },
  photos: [String], approved: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 }, notHelpful: { type: Number, default: 0 }
}, { timestamps: true });
const Review = mongoose.model('Review', reviewSchema);

// ---------- Coupon Model ----------
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountPercent: Number,
  expiry: String,
  limit: Number,
  used: { type: Number, default: 0 }
});
const Coupon = mongoose.model('Coupon', couponSchema);

// ---------- Order Model ----------
const orderSchema = new mongoose.Schema({
  items: [{
    name: String, price: Number, size: String, qty: Number
  }],
  total: Number,
  discount: Number,
  shipping: Number,
  grandTotal: Number,
  couponCode: String,
  shippingAddress: {
    fullName: String, phone: String, address: String, city: String, state: String, pincode: String
  },
  paymentId: String,
  paymentMethod: { type: String, enum: ['razorpay', 'cod'], default: 'razorpay' },
  status: { type: String, default: 'Pending' }
}, { timestamps: true });
const Order = mongoose.model('Order', orderSchema);

// ---------- Product Routes ----------
app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});
app.get('/api/products/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  product ? res.json(product) : res.status(404).json({ message: 'Not found' });
});
app.post('/api/products', async (req, res) => {
  const product = new Product(req.body);
  const saved = await product.save();
  res.status(201).json(saved);
});
app.put('/api/products/:id', async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(product);
});
app.delete('/api/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// ---------- Review Routes ----------
app.get('/api/reviews', async (req, res) => {
  const reviews = await Review.find(req.query);
  res.json(reviews);
});
app.post('/api/reviews', async (req, res) => {
  const review = new Review(req.body);
  const saved = await review.save();
  res.status(201).json(saved);
});
app.put('/api/reviews/:id', async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(review);
});
app.delete('/api/reviews/:id', async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// ---------- Coupon Routes ----------
app.get('/api/coupons', async (req, res) => {
  const coupons = await Coupon.find();
  res.json(coupons);
});
app.post('/api/coupons', async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    const saved = await coupon.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/coupons/:id', async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});
app.get('/api/coupons/validate/:code', async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() });
  if (!coupon) return res.json({ valid: false, message: 'Invalid coupon' });
  if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
    return res.json({ valid: false, message: 'Coupon expired' });
  }
  if (coupon.limit && coupon.used >= coupon.limit) {
    return res.json({ valid: false, message: 'Coupon usage limit reached' });
  }
  res.json({ valid: true, discountPercent: coupon.discountPercent });
});

// ---------- Order Routes ----------
app.get('/api/orders', async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }); // newest first
  res.json(orders);
});
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    const saved = await order.save();
    if (req.body.couponCode) {
      await Coupon.findOneAndUpdate({ code: req.body.couponCode }, { $inc: { used: 1 } });
    }
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.get('/api/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  order ? res.json(order) : res.status(404).json({ message: 'Not found' });
});
app.put('/api/orders/:id', async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(order);
});
// ---------- Coupon CRUD Routes ----------
app.get('/api/coupons', async (req, res) => {
  const coupons = await Coupon.find();
  res.json(coupons);
});

app.post('/api/coupons', async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    const saved = await coupon.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/coupons/:id', async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});
// ---------- Contact Message Model ----------
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  read: { type: Boolean, default: false }
}, { timestamps: true });
const ContactMessage = mongoose.model('ContactMessage', contactSchema);

// ---------- Contact Route ----------
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required.' });
    }
    const msg = new ContactMessage({ name, email, subject, message });
    await msg.save();
    res.status(201).json({ success: true, message: 'Message received!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: GET all messages (for admin panel)
app.get('/api/contact', async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 });
  res.json(messages);
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));