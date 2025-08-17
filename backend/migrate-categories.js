const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Service = require('./models/service');

async function migrateCategories() {
    try {
        console.log('Starting category migration...');
        
        // Find all services
        const allServices = await Service.find({});
        console.log(`Found ${allServices.length} total services.`);
        
        // Find all services without a category
        const servicesWithoutCategory = await Service.find({ 
            $or: [
                { category: { $exists: false } },
                { category: null },
                { category: '' }
            ]
        });
        
        console.log(`Found ${servicesWithoutCategory.length} services without categories.`);
        
        // Display all services for debugging
        console.log('All services:', allServices.map(s => ({
            id: s._id.toString(),
            title: s.title,
            category: s.category
        })));
        
        for (const service of servicesWithoutCategory) {
            let category = 'others'; // default category
            
            // Auto-categorize based on title keywords
            const title = service.title.toLowerCase();
            const description = (service.description || '').toLowerCase();
            
            if (title.includes('clean') || title.includes('housekeeping') || title.includes('maid') || 
                description.includes('clean') || description.includes('housekeeping')) {
                category = 'cleaning';
            } else if (title.includes('plumb') || title.includes('electric') || title.includes('repair') || 
                       title.includes('fix') || description.includes('plumb') || description.includes('electric') || 
                       description.includes('repair') || description.includes('fix')) {
                category = 'fixing';
            } else if (title.includes('paint') || title.includes('color') || 
                       description.includes('paint') || description.includes('color')) {
                category = 'painting';
            } else if (title.includes('garden') || title.includes('lawn') || title.includes('landscape') || 
                       title.includes('plant') || description.includes('garden') || description.includes('lawn') || 
                       description.includes('landscape') || description.includes('plant')) {
                category = 'gardening';
            }
            
            // Update the service with the determined category
            const updated = await Service.findByIdAndUpdate(
                service._id, 
                { category }, 
                { new: true }
            );
            console.log(`Updated service "${service.title}" with category: ${category}`);
            console.log(`Confirmed update: ${updated.category}`);
        }
        
        // Also update any services that might have undefined/empty category
        await Service.updateMany(
            { $or: [{ category: { $exists: false } }, { category: null }, { category: '' }] },
            { $set: { category: 'others' } }
        );
        
        console.log('Migration completed successfully!');
        
        // Display final status
        const finalServices = await Service.find({});
        console.log('Final service categories:', finalServices.map(s => ({
            title: s.title,
            category: s.category
        })));
        
        mongoose.connection.close();
        process.exit(0);
        
    } catch (error) {
        console.error('Migration failed:', error);
        mongoose.connection.close();
        process.exit(1);
    }
}

migrateCategories();
