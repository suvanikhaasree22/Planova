const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/authMiddleware');

// All task routes are protected
router.use(protect);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for authenticated user with optional filter & search
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { status, priority, search, sort } = req.query;

    // Base query: strictly isolate by authenticated user ID
    const query = { userId: req.user._id };

    // Filter by status if provided
    if (status && status !== 'All') {
      query.status = status;
    }

    // Filter by priority if provided
    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    // Search query across title, description, and category
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ];
    }

    // Sorting logic (default: newest first or due date)
    let sortOptions = { createdAt: -1 };
    if (sort === 'dueDateAsc') {
      sortOptions = { dueDate: 1, createdAt: -1 };
    } else if (sort === 'dueDateDesc') {
      sortOptions = { dueDate: -1, createdAt: -1 };
    } else if (sort === 'priority') {
      // High -> Medium -> Low handling in client or simple sort
      sortOptions = { priority: 1, createdAt: -1 };
    }

    const tasks = await Task.find(query).sort(sortOptions);

    // Compute live statistics for all user's tasks (unfiltered by search)
    const allUserTasks = await Task.find({ userId: req.user._id });
    const now = new Date();

    const stats = {
      total: allUserTasks.length,
      completed: allUserTasks.filter((t) => t.status === 'Completed').length,
      pending: allUserTasks.filter((t) => t.status === 'Pending').length,
      inProgress: allUserTasks.filter((t) => t.status === 'In Progress').length,
      overdue: allUserTasks.filter((t) => {
        if (!t.dueDate || t.status === 'Completed') return false;
        return new Date(t.dueDate) < now;
      }).length
    };

    return res.status(200).json({
      success: true,
      count: tasks.length,
      stats,
      tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks.'
    });
  }
});

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, category, priority, status, dueDate } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Task title is required.'
      });
    }

    const task = await Task.create({
      userId: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category && category.trim() ? category.trim() : 'General',
      priority: ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium',
      status: ['Pending', 'In Progress', 'Completed'].includes(status) ? status : 'Pending',
      dueDate: dueDate ? new Date(dueDate) : null
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully!',
      task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create task.'
    });
  }
});

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update an existing task
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, status, dueDate } = req.body;

    // Find task and verify ownership
    const task = await Task.findOne({ _id: id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized.'
      });
    }

    // Update fields if provided
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (category !== undefined) task.category = category.trim() || 'General';
    if (priority !== undefined && ['Low', 'Medium', 'High'].includes(priority)) {
      task.priority = priority;
    }
    if (status !== undefined && ['Pending', 'In Progress', 'Completed'].includes(status)) {
      task.status = status;
    }
    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : null;
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully!',
      task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update task.'
    });
  }
});

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete an existing task
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete strictly for this user
    const task = await Task.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully!'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete task.'
    });
  }
});

module.exports = router;
