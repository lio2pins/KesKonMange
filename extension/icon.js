const { createCanvas } = require('canvas')
const fs = require('fs')

const canvas = createCanvas(128, 128)
const ctx = canvas.getContext('2d')

// Fond vert
ctx.fillStyle = '#10b981'
ctx.beginPath()
ctx.roundRect(0, 0, 128, 128, 20)
ctx.fill()

// Lettre K blanche
ctx.fillStyle = '#ffffff'
ctx.font = 'bold 72px Arial'
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'
ctx.fillText('K', 64, 64)

fs.writeFileSync('icon.png', canvas.toBuffer('image/png'))
console.log('Done')