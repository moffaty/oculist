export function setupRoutes(app) {
    app.get('/', (req, res) => {
        res.json('hola')
    })
}