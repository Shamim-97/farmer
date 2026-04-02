import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-600">🌱 FreshMarket BD</h1>
            <div className="space-x-4">
              <Link href="/signin" className="text-slate-600 hover:text-slate-900">
                Sign In
              </Link>
              <Link href="/signup" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-slate-900 mb-6">
            Fresh Vegetables Delivered to Your Door
          </h2>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
            FreshMarket BD connects farmers directly with customers. Order fresh produce online and get it delivered from nearby pickup agents.
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4 mb-16">
            <Link href="/signup?role=customer" className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold text-lg">
              Order Now
            </Link>
            <Link href="/signup?role=seller" className="bg-slate-900 text-white px-8 py-3 rounded-lg hover:bg-slate-800 font-semibold text-lg">
              Become a Seller
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-slate-600">
                Get fresh produce delivered within hours from local pickup agents in your area.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🌾</div>
              <h3 className="text-xl font-semibold mb-2">Direct from Farmers</h3>
              <p className="text-slate-600">
                Connect directly with local farmers and sellers for the freshest products.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
              <p className="text-slate-600">
                Save money by ordering directly from farmers without middlemen markups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                1
              </div>
              <h3 className="font-semibold mb-2">Sign Up</h3>
              <p className="text-slate-600 text-sm">
                Create an account as a customer, seller, or pickup agent.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                2
              </div>
              <h3 className="font-semibold mb-2">Browse & Order</h3>
              <p className="text-slate-600 text-sm">
                Search for fresh products from nearby sellers and place your order.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                3
              </div>
              <h3 className="font-semibold mb-2">Confirm & Prepare</h3>
              <p className="text-slate-600 text-sm">
                Sellers confirm and prepare your order for pickup.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                4
              </div>
              <h3 className="font-semibold mb-2">Get Delivered</h3>
              <p className="text-slate-600 text-sm">
                Local pickup agents collect and deliver fresh products to your door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">For Everyone</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Customer */}
            <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-green-600">
              <h3 className="text-2xl font-bold mb-4">👥 Customer</h3>
              <ul className="space-y-2 text-slate-600 mb-6">
                <li>✓ Order fresh vegetables online</li>
                <li>✓ Track your orders in real-time</li>
                <li>✓ Request refunds if needed</li>
                <li>✓ Get SMS notifications</li>
              </ul>
              <Link href="/signup?role=customer" className="text-green-600 font-semibold hover:text-green-700">
                Start Shopping →
              </Link>
            </div>

            {/* Seller */}
            <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-blue-600">
              <h3 className="text-2xl font-bold mb-4">🌾 Seller</h3>
              <ul className="space-y-2 text-slate-600 mb-6">
                <li>✓ Verify your identity (NID)</li>
                <li>✓ Add and manage products</li>
                <li>✓ Receive orders from customers</li>
                <li>✓ Track analytics & earnings</li>
              </ul>
              <Link href="/signup?role=seller" className="text-blue-600 font-semibold hover:text-blue-700">
                Start Selling →
              </Link>
            </div>

            {/* Pickup Agent */}
            <div className="bg-white p-8 rounded-lg shadow-sm border-l-4 border-orange-600">
              <h3 className="text-2xl font-bold mb-4">🚚 Pickup Agent</h3>
              <ul className="space-y-2 text-slate-600 mb-6">
                <li>✓ Collect orders from sellers</li>
                <li>✓ GPS tracking & offline mode</li>
                <li>✓ Earn commission per delivery</li>
                <li>✓ Use mobile app on any device</li>
              </ul>
              <Link href="/signup?role=agent" className="text-orange-600 font-semibold hover:text-orange-700">
                Become an Agent →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">🌱 FreshMarket BD</h4>
              <p className="text-sm text-slate-300">
                Connecting farmers and customers for fresh produce delivery.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/signin" className="text-slate-300 hover:text-white">Sign In</Link></li>
                <li><Link href="/signup" className="text-slate-300 hover:text-white">Sign Up</Link></li>
                <li><Link href="#" className="text-slate-300 hover:text-white">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-slate-300 hover:text-white">Contact Us</Link></li>
                <li><Link href="#" className="text-slate-300 hover:text-white">FAQ</Link></li>
                <li><Link href="#" className="text-slate-300 hover:text-white">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Bangladesh</h4>
              <p className="text-sm text-slate-300">
                📍 Operating across Bangladesh
              </p>
              <p className="text-sm text-slate-300 mt-2">
                ☎️ +880 1234 5678
              </p>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2026 FreshMarket BD. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
