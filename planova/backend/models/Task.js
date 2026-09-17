const mongoose = require('mongoose');

/**
 * Task Schema for PLANOVA
 * Stores user-specific tasks with priorities, status tracking, and due dates.
 */
const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [120, 'Task title cannot exceed 120 characters']
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    trim: true,
    default: 'General',
    maxlength: [30, 'Category cannot exceed 30 characters']
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  dueDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
taskSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Task', taskSchema);
