import { BufferSchema } from '@geckos.io/typed-array-buffer-schema'
import { uint8, string8 } from '@geckos.io/typed-array-buffer-schema'

const roomSchema = BufferSchema.schema('room', {
    code: { type: string8, length: 6 },
})

module.exports = roomSchema;