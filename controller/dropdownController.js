const DropdownOption = require('../models/dropdown');

const dropdownController = {
  async addOption(req, res) {
    try {
      const { type, value, parentId } = req.body;
      const option = new DropdownOption({ type, value, parentId });
      await option.save();
      res.status(201).json({ success: true, option });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Get all options for a type
  async getOptionsOfAllTypes(req, res) {
    try {
      const types = ['Religion', 'Caste', 'Sub Caste', 'City', 'Occupation', 'Education'];
      const allDropdowns = {};
  
      for (const type of types) {
        const options = await DropdownOption.find({ type });
        allDropdowns[type] = options; // even if empty, it will be an empty array
      }
  
      res.status(200).json(allDropdowns);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  // Get all options for a type
  async getOptionsByType(req, res) {
    try {
      const { type } = req.params;
      const options = await DropdownOption.find({ type });
      res.status(200).json({ success: true, options });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },
  async updateOption(req, res) {
    try {
      const { id } = req.params;
      const { value } = req.body;
      const option = await DropdownOption.findByIdAndUpdate(id, { value }, { returnDocument: 'after' });
      res.status(200).json(option);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async deleteOption(req, res) {
    try {
      const { id } = req.params;
      await DropdownOption.findByIdAndDelete(id);
      res.status(200).json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = dropdownController
