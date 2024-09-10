import { expect } from 'chai';
import { Point, findIntersection } from '../navigation/intersection.js';
import LatLon from 'geodesy/latlon-spherical.js';

describe('findIntersection', () => {
    it('should correctly calculate the intersection point for two points with bearings', () => {
        const p1 = new Point(51.8853, 0.2545, 108.55);
        const p2 = new Point(49.0034, 2.5735, 32.44);

        const intersection = findIntersection(p1, p2);

        // Expected result from known data
        const expectedIntersection = new LatLon(50.9076, 4.5086); // Replace with actual expected values

        expect(Number(intersection.lat.toFixed(4))).to.equal(
            Number(expectedIntersection.lat.toFixed(4))
        );
        expect(Number(intersection.lon.toFixed(4))).to.equal(
            Number(expectedIntersection.lon.toFixed(4))
        );
    });

    it('should return false if points do not intersect', () => {
        const p1 = new Point(90, 0, 0); // Point at the North Pole
        const p2 = new Point(-90, 0, 180); // Point at the South Pole

        const intersection = findIntersection(p1, p2);

        expect(intersection).to.be.false;
    });

    it('should return an intersection point even when points are close to the equator', () => {
        const p1 = new Point(0.1, 0.1, 90);
        const p2 = new Point(0.1, 2.1, 270);

        const intersection = findIntersection(p1, p2);

        expect(intersection).to.be.an.instanceof(LatLon);
        expect(intersection.lat).to.be.a('number');
        expect(intersection.lon).to.be.a('number');
    });
});
