const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully');
    createTestNotifications();
}).catch(error => {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
});

// Define models
const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['booking', 'message', 'system', 'payment', 'negotiation']
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    relatedModel: {
        type: String,
        required: false,
        enum: ['Booking', 'Service', 'User', 'Negotiation']
    },
    actionRequired: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'provider'], required: true }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
const User = mongoose.model('User', userSchema);

async function createTestNotifications() {
    try {
        // Find a user to create notifications for
        let user = await User.findOne();
        
        if (!user) {
            // Create a test user if none exists
            user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword',
                role: 'user'
            });
            await user.save();
            console.log('Created test user:', user._id);
        } else {
            console.log('Using existing user:', user._id);
        }

        // Clear existing notifications for this user
        await Notification.deleteMany({ userId: user._id });
        console.log('Cleared existing notifications');

        // Create test notifications
        const testNotifications = [
            {
                userId: user._id,
                type: 'booking',
                title: 'Booking Confirmed',
                message: 'Your booking for house cleaning has been confirmed.',
                priority: 'high',
                actionRequired: false
            },
            {
                userId: user._id,
                type: 'message',
                title: 'New Message',
                message: 'You have received a new message from your service provider.',
                priority: 'medium',
                actionRequired: true
            },
            {
                userId: user._id,
                type: 'system',
                title: 'Welcome!',
                message: 'Welcome to our platform! Your account has been successfully created.',
                priority: 'low',
                actionRequired: false
            },
            {
                userId: user._id,
                type: 'negotiation',
                title: 'Price Negotiation',
                message: 'A service provider has responded to your price negotiation.',
                priority: 'high',
                actionRequired: true
            },
            {
                userId: user._id,
                type: 'payment',
                title: 'Payment Received',
                message: 'Your payment of $150 has been successfully processed.',
                priority: 'medium',
                actionRequired: false
            }
        ];

        const createdNotifications = await Notification.insertMany(testNotifications);
        console.log('Created test notifications:', createdNotifications.length);

        // Display created notifications
        const notifications = await Notification.find({ userId: user._id }).sort({ createdAt: -1 });
        console.log('\nCreated notifications:');
        notifications.forEach(notification => {
            console.log(`- ${notification.title}: ${notification.message} (${notification.type})`);
        });

        console.log('\nTest notifications created successfully!');
        console.log('You can now test the notification system in your frontend.');
        
    } catch (error) {
        console.error('Error creating test notifications:', error);
    } finally {
        mongoose.connection.close();
    }
}
