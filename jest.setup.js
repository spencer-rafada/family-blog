import '@testing-library/jest-dom'

// Mock for Radix UI's pointer capture which is not supported in jsdom
if (typeof window !== 'undefined') {
  Element.prototype.hasPointerCapture = jest.fn()
  Element.prototype.setPointerCapture = jest.fn()
  Element.prototype.releasePointerCapture = jest.fn()
  
  // Mock scrollIntoView which is used by Radix UI Select
  Element.prototype.scrollIntoView = jest.fn()
  
  // Mock other DOM methods used by Radix UI
  if (!window.HTMLElement.prototype.scrollTo) {
    window.HTMLElement.prototype.scrollTo = jest.fn()
  }
}