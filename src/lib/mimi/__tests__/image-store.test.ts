/**
 * MIMI Agent — Image Store Tests (B-02)
 * TDD Phase 1: RED → GREEN
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { ImageStore } from '../image-store'

describe('B-02: ImageStore', () => {
    beforeEach(() => {
        ImageStore.clear()
    })

    it('should return null when no image stored', () => {
        expect(ImageStore.get()).toBeNull()
    })

    it('should store and retrieve an image', () => {
        ImageStore.set('data:image/png;base64,abc123')
        expect(ImageStore.get()).toBe('data:image/png;base64,abc123')
    })

    it('should clear stored image', () => {
        ImageStore.set('data:image/png;base64,abc123')
        ImageStore.clear()
        expect(ImageStore.get()).toBeNull()
    })

    it('should overwrite previous image', () => {
        ImageStore.set('data:image/png;base64,first')
        ImageStore.set('data:image/jpeg;base64,second')
        expect(ImageStore.get()).toBe('data:image/jpeg;base64,second')
    })

    it('should report hasImage correctly', () => {
        expect(ImageStore.hasImage()).toBe(false)
        ImageStore.set('data:image/png;base64,abc')
        expect(ImageStore.hasImage()).toBe(true)
        ImageStore.clear()
        expect(ImageStore.hasImage()).toBe(false)
    })
})
