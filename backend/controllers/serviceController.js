const Service = require('../models/service');
class ServiceController {
    async getAllServices(req, res) {
        try {
            const { category, search } = req.query;
            let query = {};
            
            // Add category filter if provided
            if (category && category !== 'all') {
                query.category = category;
            }
            
            // Add search filter if provided
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }
            
            const services = await Service.find(query).populate('provider', 'name email');
            res.status(200).json(services);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async createService(req, res) {
        try {
            // Only allow providers to create services
            if (!req.user || req.user.role !== 'provider') {
                return res.status(403).json({ message: 'Only providers can create services.' });
            }
            const { 
                title, 
                description, 
                price, 
                category, 
                instantService, 
                estimatedDuration, 
                serviceRadius,
                latitude,
                longitude,
                address 
            } = req.body;
            
            if (!title || !description || !price || !category) {
                return res.status(400).json({ message: 'All fields including category are required.' });
            }
            
            // Validate category
            const validCategories = [
                'cleaning', 'plumbing', 'electrical', 'painting', 'gardening', 
                'moving', 'handyman', 'automotive', 'tutoring', 'fitness', 
                'beauty', 'pet-care', 'appliance-repair', 'carpentry', 'roofing', 'others'
            ];
            if (!validCategories.includes(category)) {
                return res.status(400).json({ message: 'Invalid category. Must be one of: ' + validCategories.join(', ') });
            }
            
            const service = new Service({
                title,
                description,
                price,
                category,
                provider: req.user._id,
                availability: req.body.availability !== undefined ? req.body.availability : true,
                instantService: instantService || false,
                estimatedDuration: estimatedDuration || 60,
                serviceRadius: serviceRadius || 5
            });

            // Add location if provided
            if (latitude && longitude) {
                service.location = {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)],
                    address: address || ''
                };
            }
            
            const savedService = await service.save();
            res.status(201).json(savedService);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async getMyServices(req, res) {
        try {
            // Only return active services (availability: true) for the authenticated provider
            const services = await Service.find({ 
                provider: req.user._id,
                availability: true 
            }).populate('provider', 'name email');
            
            res.status(200).json({
                success: true,
                data: services,
                count: services.length
            });
        } catch (error) {
            console.error('Error fetching my services:', error);
            res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    async toggleServiceAvailability(req, res) {
        try {
            const serviceId = req.params.id;
            const userId = req.user._id;

            // Find the service and ensure it belongs to the authenticated provider
            const service = await Service.findOne({ 
                _id: serviceId, 
                provider: userId 
            });

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Service not found or you do not have permission to modify it'
                });
            }

            // Toggle availability
            service.availability = !service.availability;
            await service.save();

            res.status(200).json({
                success: true,
                message: `Service ${service.availability ? 'activated' : 'deactivated'} successfully`,
                data: service
            });
        } catch (error) {
            console.error('Error toggling service availability:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getAllMyServices(req, res) {
        try {
            // Return all services (both active and inactive) for provider management
            const services = await Service.find({ 
                provider: req.user._id 
            }).populate('provider', 'name email');
            
            res.status(200).json({
                success: true,
                data: services,
                count: services.length
            });
        } catch (error) {
            console.error('Error fetching all my services:', error);
            res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    async bookService(req, res) {
        try {
            const service = await Service.findById(req.params.id);
            if (!service) {
                return res.status(404).json({ message: 'Service not found' });
            }
            // Logic for booking the service can be added here
            res.status(200).json({ message: 'Service booked successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getCategories(req, res) {
        try {
            const categories = [
                { id: 'all', name: 'All Categories', icon: '🔍' },
                { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
                { id: 'plumbing', name: 'Plumbing', icon: '🔧' },
                { id: 'electrical', name: 'Electrical', icon: '⚡' },
                { id: 'painting', name: 'Painting', icon: '🎨' },
                { id: 'gardening', name: 'Gardening', icon: '🌱' },
                { id: 'moving', name: 'Moving', icon: '📦' },
                { id: 'handyman', name: 'Handyman', icon: '🔨' },
                { id: 'automotive', name: 'Automotive', icon: '🚗' },
                { id: 'tutoring', name: 'Tutoring', icon: '📚' },
                { id: 'fitness', name: 'Fitness', icon: '💪' },
                { id: 'beauty', name: 'Beauty & Wellness', icon: '💄' },
                { id: 'pet-care', name: 'Pet Care', icon: '🐕' },
                { id: 'appliance-repair', name: 'Appliance Repair', icon: '🔧' },
                { id: 'carpentry', name: 'Carpentry', icon: '🪚' },
                { id: 'roofing', name: 'Roofing', icon: '🏠' },
                { id: 'others', name: 'Others', icon: '⭐' }
            ];
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getServicesByCategory(req, res) {
        try {
            const { category } = req.params;
            let query = {};
            
            if (category && category !== 'all') {
                query.category = category;
            }
            
            const services = await Service.find(query).populate('provider', 'name email');
            res.status(200).json({
                success: true,
                category: category,
                count: services.length,
                data: services
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    async updateService(req, res) {
        try {
            const { id } = req.params;
            const { title, description, category, startingPrice, address } = req.body;

            // Find the service and check if user owns it
            const service = await Service.findById(id);
            if (!service) {
                return res.status(404).json({ message: 'Service not found' });
            }

            // Check if the current user is the owner
            if (service.provider.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'You can only update your own services' });
            }

            // Calculate min and max prices (30% range)
            const minPrice = Math.floor(startingPrice * 0.7);
            const maxPrice = Math.ceil(startingPrice * 1.3);

            // Update the service
            const updatedService = await Service.findByIdAndUpdate(
                id,
                {
                    title,
                    description,
                    category,
                    startingPrice,
                    minPrice,
                    maxPrice,
                    address
                },
                { new: true }
            ).populate('provider', 'name email');

            res.status(200).json({
                success: true,
                message: 'Service updated successfully',
                data: updatedService
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    }

    async deleteService(req, res) {
        try {
            const { id } = req.params;

            // Find the service and check if user owns it
            const service = await Service.findById(id);
            if (!service) {
                return res.status(404).json({ message: 'Service not found' });
            }

            // Check if the current user is the owner
            if (service.provider.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'You can only delete your own services' });
            }

            await Service.findByIdAndDelete(id);

            res.status(200).json({
                success: true,
                message: 'Service deleted successfully'
            });
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    }
}

module.exports = new ServiceController();