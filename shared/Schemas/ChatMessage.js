import { BufferSchema } from '@geckos.io/typed-array-buffer-schema'
import { uint8, string8 } from '@geckos.io/typed-array-buffer-schema'

const chatMessageSchema = BufferSchema.schema('chatMessage', {
    id: uint8,
    value: { type: string8, length: 64 },
    personId: uint8,
})

module.exports = chatMessageSchema;