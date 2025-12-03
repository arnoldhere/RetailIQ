const db = require('../../config/db')

module.exports = {
  // List all categories with pagination
  listAll: async (limit = 100, offset = 0) => {
    return db('categories')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
  },

  // Get single category by ID
  findById: async (id) => {
    if (!id) return null
    return db('categories').where({ id }).first()
  },

  // Create new category
  create: async (data) => {
    const { name, description } = data
    if (!name || !name.trim()) throw new Error('Name is required')

    const [id] = await db('categories').insert({ name: name.trim(), description })
    const category = await db('categories').where({ id }).first()
    return category
  },

  // Update category
  update: async (id, data) => {
    if (!id) throw new Error('ID required')
    const { name, description } = data
    if (name && !name.trim()) throw new Error('Name cannot be empty')

    await db('categories').where({ id }).update({
      name: name ? name.trim() : undefined,
      description,
      updated_at: new Date(),
    })

    const category = await db('categories').where({ id }).first()
    return category
  },

  // Delete category
  delete: async (id) => {
    if (!id) throw new Error('ID required')
    const count = await db('categories').where({ id }).del()
    return count > 0
  },

  // Count total categories
  count: async () => {
    const result = await db('categories').count('id as count').first()
    return Number(result.count || 0)
  },
}
