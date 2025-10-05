import { useState } from "react";
import { ShoppingCart, Package, Gavel, Home, LogOut, Upload, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ArtItem {
  id: number;
  name: string;
  price: number;
  detail: string;
  image: string;
  artist: string;
}

interface CartItem extends ArtItem {
  quantity: number;
}

interface Order {
  id: number;
  items: CartItem[];
  total: number;
  date: string;
}

const generateRandomPrice = () => Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;

const MOCK_ART_ITEMS: ArtItem[] = [
  {
    id: 1,
    name: "Celestial Dreams",
    price: generateRandomPrice(),
    detail: "An ethereal abstract piece exploring the cosmos through vibrant purples and golds. This masterpiece captures the infinite beauty of space.",
    image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=600&fit=crop",
    artist: "Luna Martinez"
  },
  {
    id: 2,
    name: "Urban Symphony",
    price: generateRandomPrice(),
    detail: "A contemporary cityscape that blends architectural precision with artistic expression. The interplay of light and shadow creates a mesmerizing rhythm.",
    image: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800&h=600&fit=crop",
    artist: "Marcus Chen"
  },
  {
    id: 3,
    name: "Ocean Reverie",
    price: generateRandomPrice(),
    detail: "Fluid acrylic waves in deep teals and aquamarines that seem to move before your eyes. A tribute to the ocean's eternal dance.",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop",
    artist: "Sofia Ramirez"
  },
  {
    id: 4,
    name: "Golden Hour",
    price: generateRandomPrice(),
    detail: "Warm amber and gold tones capture that magical moment when day transitions to night. A celebration of light and transformation.",
    image: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&h=600&fit=crop",
    artist: "David Park"
  },
  {
    id: 5,
    name: "Violet Cascade",
    price: generateRandomPrice(),
    detail: "Layers of rich purples and violets create a waterfall of color. This piece invites deep contemplation and inner peace.",
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop",
    artist: "Isabella Torres"
  },
  {
    id: 6,
    name: "Crimson Passion",
    price: generateRandomPrice(),
    detail: "Bold strokes of red and orange that pulse with energy and emotion. A powerful statement piece for any collection.",
    image: "https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=800&h=600&fit=crop",
    artist: "Rafael Santos"
  }
];

const AUCTION_ITEM: ArtItem = {
  id: 999,
  name: "The Masterpiece Collection",
  price: 15000,
  detail: "An exclusive limited edition piece from our most celebrated artist. This rare work combines traditional techniques with modern innovation, creating a timeless masterpiece that will only increase in value. Only one available.",
  image: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&h=600&fit=crop",
  artist: "Alessandro Fontana"
};

type BuyerPage = "home" | "detail" | "cart" | "orders" | "auction";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<"buyer" | "seller" | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPage, setCurrentPage] = useState<BuyerPage>("home");
  const [selectedItem, setSelectedItem] = useState<ArtItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [artItems, setArtItems] = useState<ArtItem[]>(MOCK_ART_ITEMS);
  
  // Auction state
  const [currentBid, setCurrentBid] = useState(AUCTION_ITEM.price);
  const [userBid, setUserBid] = useState("");
  const [highestBidder, setHighestBidder] = useState("Current Reserve");

  // Seller form state
  const [newArt, setNewArt] = useState({
    name: "",
    price: "",
    detail: "",
    image: "",
    artist: ""
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRole) {
      toast.error("Please select a role");
      return;
    }
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setIsLoggedIn(true);
    toast.success(`Welcome to ArtVault, ${email}!`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole("");
    setEmail("");
    setPassword("");
    setCurrentPage("home");
    toast.success("Logged out successfully");
  };

  const addToCart = (item: ArtItem) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success("Added to cart!");
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const buyNow = (item: ArtItem) => {
    const newOrder: Order = {
      id: orders.length + 1,
      items: [{ ...item, quantity: 1 }],
      total: item.price,
      date: new Date().toLocaleDateString()
    };
    setOrders([...orders, newOrder]);
    toast.success("Purchase completed!");
    setCurrentPage("orders");
  };

  const checkout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newOrder: Order = {
      id: orders.length + 1,
      items: [...cart],
      total,
      date: new Date().toLocaleDateString()
    };
    setOrders([...orders, newOrder]);
    setCart([]);
    toast.success("Order placed successfully!");
    setCurrentPage("orders");
  };

  const placeBid = () => {
    const bid = parseFloat(userBid);
    if (isNaN(bid) || bid <= currentBid) {
      toast.error(`Bid must be higher than $${currentBid.toLocaleString()}`);
      return;
    }
    setCurrentBid(bid);
    setHighestBidder("You");
    setUserBid("");
    toast.success("Bid placed successfully!");
  };

  const handleAddArt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArt.name || !newArt.price || !newArt.detail || !newArt.artist) {
      toast.error("Please fill in all fields");
      return;
    }
    
    const artItem: ArtItem = {
      id: artItems.length + 1,
      name: newArt.name,
      price: parseFloat(newArt.price),
      detail: newArt.detail,
      image: newArt.image || "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop",
      artist: newArt.artist
    };
    
    setArtItems([...artItems, artItem]);
    setNewArt({ name: "", price: "", detail: "", image: "", artist: "" });
    toast.success("Art piece added successfully!");
  };

  // Login Page
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero animate-fade-in">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-5xl font-bold font-poppins gradient-primary bg-clip-text text-transparent">
              ArtVault
            </CardTitle>
            <CardDescription className="text-base">
              Discover and collect extraordinary art
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Select Your Role</Label>
                <Select value={userRole} onValueChange={(value: "buyer" | "seller") => setUserRole(value)}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Choose role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
              >
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Seller View
  if (userRole === "seller") {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold font-poppins gradient-primary bg-clip-text text-transparent">
              ArtVault - Seller
            </h1>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 animate-fade-in">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Add New Art Piece
              </CardTitle>
              <CardDescription>
                Share your artwork with collectors around the world
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddArt} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="artName">Art Name</Label>
                  <Input
                    id="artName"
                    value={newArt.name}
                    onChange={(e) => setNewArt({...newArt, name: e.target.value})}
                    placeholder="Enter art name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="artist">Artist Name</Label>
                  <Input
                    id="artist"
                    value={newArt.artist}
                    onChange={(e) => setNewArt({...newArt, artist: e.target.value})}
                    placeholder="Enter artist name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newArt.price}
                    onChange={(e) => setNewArt({...newArt, price: e.target.value})}
                    placeholder="Enter price"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="detail">Details</Label>
                  <Textarea
                    id="detail"
                    value={newArt.detail}
                    onChange={(e) => setNewArt({...newArt, detail: e.target.value})}
                    placeholder="Describe the artwork"
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL (optional)</Label>
                  <Input
                    id="image"
                    value={newArt.image}
                    onChange={(e) => setNewArt({...newArt, image: e.target.value})}
                    placeholder="Enter image URL"
                  />
                </div>
                
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Add Art Piece
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Buyer View Navigation
  const BuyerNav = () => (
    <nav className="flex gap-1 bg-muted/50 p-1 rounded-lg">
      <Button
        variant={currentPage === "home" ? "default" : "ghost"}
        size="sm"
        onClick={() => setCurrentPage("home")}
        className={currentPage === "home" ? "bg-primary" : ""}
      >
        <Home className="w-4 h-4 mr-2" />
        Home
      </Button>
      <Button
        variant={currentPage === "cart" ? "default" : "ghost"}
        size="sm"
        onClick={() => setCurrentPage("cart")}
        className={currentPage === "cart" ? "bg-primary" : ""}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Cart {cart.length > 0 && `(${cart.length})`}
      </Button>
      <Button
        variant={currentPage === "orders" ? "default" : "ghost"}
        size="sm"
        onClick={() => setCurrentPage("orders")}
        className={currentPage === "orders" ? "bg-primary" : ""}
      >
        <Package className="w-4 h-4 mr-2" />
        Orders
      </Button>
      <Button
        variant={currentPage === "auction" ? "default" : "ghost"}
        size="sm"
        onClick={() => setCurrentPage("auction")}
        className={currentPage === "auction" ? "bg-primary" : ""}
      >
        <Gavel className="w-4 h-4 mr-2" />
        Auction
      </Button>
    </nav>
  );

  // Home Page
  const HomePage = () => (
    <div className="animate-fade-in">
      <div className="gradient-hero text-primary-foreground p-12 rounded-xl mb-8 text-center">
        <h2 className="text-4xl font-bold mb-4">Discover Extraordinary Art</h2>
        <p className="text-lg opacity-90 max-w-2xl mx-auto">
          Explore our curated collection of contemporary masterpieces from talented artists worldwide
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artItems.map((item) => (
          <Card 
            key={item.id} 
            className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            onClick={() => {
              setSelectedItem(item);
              setCurrentPage("detail");
            }}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <CardHeader>
              <CardTitle className="text-xl">{item.name}</CardTitle>
              <CardDescription>by {item.artist}</CardDescription>
            </CardHeader>
            <CardFooter className="justify-between">
              <span className="text-2xl font-bold gradient-accent bg-clip-text text-transparent">
                ${item.price.toLocaleString()}
              </span>
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(item);
                }}
                className="bg-primary hover:bg-primary/90"
              >
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  // Item Detail Page
  const DetailPage = () => {
    if (!selectedItem) return null;
    
    return (
      <div className="animate-fade-in">
        <Button 
          variant="outline" 
          onClick={() => setCurrentPage("home")}
          className="mb-6"
        >
          ← Back to Gallery
        </Button>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-xl overflow-hidden shadow-2xl">
            <img 
              src={selectedItem.image} 
              alt={selectedItem.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{selectedItem.name}</h1>
              <p className="text-xl text-muted-foreground">by {selectedItem.artist}</p>
            </div>
            
            <div className="text-3xl font-bold gradient-accent bg-clip-text text-transparent">
              ${selectedItem.price.toLocaleString()}
            </div>
            
            <p className="text-lg leading-relaxed">{selectedItem.detail}</p>
            
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={() => addToCart(selectedItem)}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button 
                onClick={() => buyNow(selectedItem)}
                size="lg"
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Cart Page
  const CartPage = () => (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold mb-6">Shopping Cart</h2>
      
      {cart.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">Your cart is empty</p>
          <Button 
            onClick={() => setCurrentPage("home")}
            className="mt-4 bg-primary hover:bg-primary/90"
          >
            Browse Gallery
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="flex gap-6">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                  <p className="text-muted-foreground mb-2">by {item.artist}</p>
                  <p className="text-2xl font-bold gradient-accent bg-clip-text text-transparent">
                    ${item.price.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-semibold w-8 text-center">{item.quantity}</span>
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          <Card className="p-6 bg-muted/50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold">Total:</span>
              <span className="text-3xl font-bold gradient-accent bg-clip-text text-transparent">
                ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
              </span>
            </div>
            <Button 
              onClick={checkout}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      )}
    </div>
  );

  // Orders Page
  const OrdersPage = () => (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold mb-6">Order History</h2>
      
      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">No orders yet</p>
          <Button 
            onClick={() => setCurrentPage("home")}
            className="mt-4 bg-primary hover:bg-primary/90"
          >
            Start Shopping
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex justify-between">
                  <div>
                    <CardTitle>Order #{order.id}</CardTitle>
                    <CardDescription>{order.date}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold gradient-accent bg-clip-text text-transparent">
                      ${order.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">by {item.artist}</p>
                        <p className="text-sm">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-bold">${(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Auction Page
  const AuctionPage = () => (
    <div className="animate-fade-in">
      <div className="gradient-primary text-primary-foreground p-8 rounded-xl mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Live Auction</h2>
        <p className="text-lg opacity-90">Exclusive masterpiece - Bidding ends in 2 days</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square rounded-xl overflow-hidden shadow-2xl">
          <img 
            src={AUCTION_ITEM.image} 
            alt={AUCTION_ITEM.name} 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{AUCTION_ITEM.name}</h1>
            <p className="text-xl text-muted-foreground">by {AUCTION_ITEM.artist}</p>
          </div>
          
          <p className="text-lg leading-relaxed">{AUCTION_ITEM.detail}</p>
          
          <Card className="p-6 bg-accent/10 border-accent">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Bid</p>
                <p className="text-4xl font-bold gradient-accent bg-clip-text text-transparent">
                  ${currentBid.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Highest Bidder: {highestBidder}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bid">Your Bid ($)</Label>
                <div className="flex gap-2">
                  <Input
                    id="bid"
                    type="number"
                    value={userBid}
                    onChange={(e) => setUserBid(e.target.value)}
                    placeholder={`Minimum: $${(currentBid + 100).toLocaleString()}`}
                    className="flex-1"
                  />
                  <Button 
                    onClick={placeBid}
                    className="bg-accent hover:bg-accent/90"
                  >
                    Place Bid
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  // Buyer View Main Layout
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold font-poppins gradient-primary bg-clip-text text-transparent">
              ArtVault
            </h1>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
          <BuyerNav />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {currentPage === "home" && <HomePage />}
        {currentPage === "detail" && <DetailPage />}
        {currentPage === "cart" && <CartPage />}
        {currentPage === "orders" && <OrdersPage />}
        {currentPage === "auction" && <AuctionPage />}
      </main>
    </div>
  );
};

export default Index;
