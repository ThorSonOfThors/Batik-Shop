import { Router } from 'express'
import { createPaymentIntent } from './controller.ts'

const router = Router()

router.post('/create-intent', createPaymentIntent)

export default router
