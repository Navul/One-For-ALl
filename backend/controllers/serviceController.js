const Service = require('../models/service');
class ServiceController {
    async getAllServices(req, res) {
        try {
            const services = await Service.find();
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
            const { title, description, price } = req.body;
            if (!title || !description || !price) {
                return res.status(400).json({ message: 'All fields are required.' });
            }
            const service = new Service({
                title,
                description,
                price,
                provider: req.user._id,
                availability: req.body.availability !== undefined ? req.body.availability : true,
            });
            const savedService = await service.save();
            res.status(201).json(savedService);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async getMyServices(req, res) {
        try {
            const services = await Service.find({ provider: req.user._id });
            res.status(200).json({
                success: true,
                data: services
            });
        } catch (error) {
            console.error('Error fetching my services:', error);
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
}

module.exports = new ServiceController();