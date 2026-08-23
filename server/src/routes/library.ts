import { Router } from 'express'
import { pool } from '../db/pool.js'
import { bulkUpsertLibraryBooks, deleteLibraryBook, listLibraryByUser, upsertLibraryBook } from '../db/repositories/libraryRepo.js'
import { bookSummaryBodySchema, libraryImportSchema } from '../lib/validation.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const libraryRouter = Router()
libraryRouter.use(requireAuth)

libraryRouter.get('/', async (req, res) => {
  const books = await listLibraryByUser(pool, req.userId!)
  res.status(200).json({ books })
})

libraryRouter.put('/:bookId', async (req, res) => {
  const body = bookSummaryBodySchema.parse(req.body)
  const book = await upsertLibraryBook(pool, req.userId!, { ...body, bookId: req.params.bookId! })
  res.status(200).json({ book })
})

libraryRouter.delete('/:bookId', async (req, res) => {
  await deleteLibraryBook(pool, req.userId!, req.params.bookId!)
  res.status(204).end()
})

libraryRouter.post('/import', async (req, res) => {
  const { books } = libraryImportSchema.parse(req.body)
  const imported = await bulkUpsertLibraryBooks(pool, req.userId!, books)
  res.status(200).json({ imported })
})
