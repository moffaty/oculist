class Locate {
    constructor(x1, y1, x2, y2, d1, d2, corner1, corner2) {
        this.time = new Date();
        this.R = 6371.0;
        this.lat = null;
        this.lon = null;
        this.intersection = null;
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
        this.d1 = d1;
        this.d2 = d2;
        this.corner1 = corner1;
        this.corner2 = corner2;
    }

    #updateTime() {
        this.time = new Date();
    }

    setLat(lat) {
        this.lat = lat;
        this.#updateTime();
    }

    getLat() {
        return this.lat;
    }

    setLon(lon) {
        this.lon = lon;
        this.#updateTime();
    }

    getLon() {
        return this.lon;
    }

    calcFirst() {
        this.lat =
            this.x1 +
            this.haversine(this.x1, this.x2, this.y1, this.y2) *
                Math.cos(this.corner1);
        this.lon = this.y1 + this.haversine() * Math.cos(this.corner1);
        console.log(this.lat, this.lon);
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    haversine(lat1, lon1, lat2, lon2) {
        const phi1 = this.toRadians(lat1);
        const lambda1 = this.toRadians(lon1);
        const phi2 = this.toRadians(lat2);
        const lambda2 = this.toRadians(lon2);

        const deltaPhi = phi2 - phi1;
        const deltaLambda = lambda2 - lambda1;

        const a =
            Math.sin(deltaPhi / 2) ** 2 +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = this.R * c;
        return distance;
    }

    // findIntersection() {
    //     // d = √((хА – хВ)2 + (уА – уВ)2)
    //     const d = Math.sqrt(this.#sqr(this.x2 - this.x1) + this.#sqr(this.y2 - this.y1));
    //     console.log(d);
    //     this.intersection = (this.#sqr(this.d1) - this.#sqr(this.d2) + this.#sqr(d)) / (2 * d);
    //     this.height = this.#sqr(this.d1) - this.#sqr(this.intersection);
    //     this.lat = this.x2 + -this.height * (this.y1 - this.y2)
    //     console.log(this.intersection);
    //     console.log(this.height);
    // }
}
// 60.035631, 29.772631
const locate = new Locate(
    60.029847,
    29.757576,
    60.028204,
    29.792231,
    1.03,
    1.13,
    90,
    90
);
console.log(locate.haversine(60.029847, 29.757576, 60.028204, 29.792231));
