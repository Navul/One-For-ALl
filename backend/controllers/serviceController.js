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
        const service = new Service({
            title: req.body.title,
            description: req.body.description,
            provider: req.body.provider,
            availability: req.body.availability,
        });

        try {
            const savedService = await service.save();
            res.status(201).json(savedService);
        } catch (error) {
            res.status(400).json({ message: error.message });
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