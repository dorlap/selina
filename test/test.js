const { expect } = require('chai');
const { fillDataLocationRoom, truncateLocationRoomBooking, ROOM_TYPE_COUNT, truncateBooking } = require('./db');
const { getAvailableRooms, bookRoom, getLocations, getTopThreeLocations } = require('../db/db');
const locations = require('../data/location');

describe('Database', () => {
    before(async () => {
        await truncateLocationRoomBooking();
        await fillDataLocationRoom();
    });

    after(async () => {
        await truncateBooking();
    })

    const locationId = 1;
    const start = '2019-08-7';
    const end = '2019-08-14';

    const bookRoomsByPeriod = async ({ type, period, size }) => {
        const periods = new Array(size).fill(period);
        const booking = periods.map(({ start, end }) => bookRoom(locationId, start, end, type));
        const result = await Promise.all(booking);
        expect(result).not.to.includes(false);
    }

    const checkIfRoomTypesAvailable = async ({ locationId, start, end, types }) => {
        const res = await getAvailableRooms(locationId, start, end);
        expect(res).to.be.an('Array').length(types.length);
        for (const type of types) {
            expect(res).to.deep.includes({ type });
        }
    }

    describe('Locations', async () => {
        const stringCompare = ({ country: country1, city: city1 }, { country: country2, city: city2 }) => {
            country1 = country1.toLowerCase();
            country2 = country2.toLowerCase();
            if (country1 > country2) {
                return 1
            } else if (country2 > country1) {
                return -1;
            }
            city1 = city1.toLowerCase();
            city2 = city2.toLowerCase();
            if (city1 > city2) {
                return 1
            } else if (city2 > city1) {
                return -1;
            }
            return 0;
        };

        it('return all locations', async () => {
            const result = await getLocations({});
            expect(result).to.be.an('Array').length(locations.length);
        });

        it('return all location that includes "Ecu" in the country name', async () => {
            const result = await getLocations({ filter: 'Ecu' });
            const localResult = locations.map(({ country }) => country.toLowerCase().includes('ecu')).filter(res => res);
            expect(result).to.be.an('Array').length(localResult.length);
        });

        it('order location by country asc', async () => {
            const result = await getLocations({ order: 'ASC' });
            const localLocation = [...locations];
            localLocation.sort(stringCompare);
            expect(result).to.be.an('Array').length(localLocation.length)
            for (let i = 0; i < localLocation.length; i++) {
                if (localLocation[i].country !== result[i].country) {
                    throw new Error('Sorting went wrong');
                }
            }
        });

        it('order location by country desc', async () => {
            const result = await getLocations({ order: 'DESC' });
            let localResult = [...locations];
            localResult = localResult.sort(stringCompare).reverse();
            expect(result).to.be.an('Array').length(localResult.length)
            for (let i = 0; i < localResult.length; i++) {
                if (localResult[i].country !== result[i].country) {
                    throw new Error('Sorting went wrong');
                }
            }
        });

        it('filter and order', async () => {
            const result = await getLocations({ filter: 'Ecu', order: 'ASC' });
            const localResult = locations.map(({ country, city }) => {
                if (country.toLowerCase().includes('ecu')) {
                    return { country, city };
                }
            }).filter(res => res);
            localResult.sort(stringCompare);
            expect(result).to.be.an('Array').length(localResult.length)
            for (let i = 0; i < localResult.length; i++) {
                if (localResult[i].country !== result[i].country) {
                    throw new Error('Sorting went wrong');
                }
            }
        });
    })

    describe('Top location', () => {
        before(async () => {
            await truncateBooking();
            const type = 'Dorm';
            const booking = [];
            for (let i = 0; i < 10; i++) {
                booking.push(bookRoom(i + 1, start, end, type));
            }
            const result = await Promise.all(booking);
            expect(result).not.to.includes(false);
        });

        it('10 location have 1 booking need to return same result with 2 querys', async () => {
            const res1 = await getTopThreeLocations();
            const res2 = await getTopThreeLocations();
            expect(res1).to.be.an('Array');
            expect(res2).to.be.an('Array');
            expect(res1).to.have.length(res2.length);
            for (let i = 0; i < res1.length; i++) {
                expect(res1[i].id).to.be.equal(res2[i].id);
            }
        });

        it('10 location have 1 booking need to return same result with 2 querys', async () => {
            const type = 'Dorm';
            const booking = [
                bookRoom(1, start, end, type),
                bookRoom(1, start, end, type),
                bookRoom(2, start, end, type),
                bookRoom(9, start, end, type),
                bookRoom(9, start, end, type),
            ];
            const result = await Promise.all(booking);
            expect(result).not.to.includes(false);
            let res = await getTopThreeLocations();
            expect(res).to.be.an('Array');
            res = res.map(({ id }) => ({ id }));
            expect(res).to.deep.includes({ id: 1 });
            expect(res).to.deep.includes({ id: 2 });
            expect(res).to.deep.includes({ id: 9 });
        });
    });

    describe('Room booking and available', () => {
        before(async () => {
            await truncateBooking();
        });

        it('should return all room types when booking is empty', async () => {
            await checkIfRoomTypesAvailable({ locationId, start, end, types: ['Dorm', 'Private', 'Deluxe'] })
        });

        it('book 9 Dorm rooms', async () => {
            await bookRoomsByPeriod({ size: ROOM_TYPE_COUNT - 1, type: 'Dorm', period: { start, end } })
        });

        it('should return all room types when booking has 9 Dorm booked', async () => {
            await checkIfRoomTypesAvailable({ locationId, start, end, types: ['Dorm', 'Private', 'Deluxe'] })
        });

        it('book another Dorm room', async () => {
            const type = 'Dorm';
            const result = await bookRoom(locationId, start, end, type);
            expect(result).to.be.true;
        });

        it('should return 2 room types all Dorm are booked', async () => {
            await checkIfRoomTypesAvailable({ locationId, start, end, types: ['Private', 'Deluxe'] })
        });

        it('book 11 Private rooms only 10 will be approve', async () => {
            const type = 'Private';
            const booking = [];
            for (let i = 0; i < ROOM_TYPE_COUNT + 1; i++) {
                booking.push(bookRoom(locationId, start, end, type));
            }
            const result = await Promise.all(booking);
            expect(result).to.be.an('Array');
            expect(result.filter(res => !res)).to.have.length(1);
        });

        it('should return 1 room type all Dorm and Private are booked', async () => {
            await checkIfRoomTypesAvailable({ locationId, start, end, types: ['Deluxe'] })
        });

        it('book 10 Deluxe rooms at a different location', async () => {
            const type = 'Deluxe';
            const booking = [];
            const locationId = 2;
            for (let i = 0; i < ROOM_TYPE_COUNT; i++) {
                booking.push(bookRoom(locationId, start, end, type));
            }
            const result = await Promise.all(booking);
            expect(result).not.to.includes(false);
        });

        it('should return 1 room type all Dorm and Private are booked', async () => {
            await checkIfRoomTypesAvailable({ locationId, start, end, types: ['Deluxe'] })
        });
    });


    describe('all date edge cases', () => {
        /*
            booking period 2019-08-7 to 2019-08-14
            ------------|--------------|------------- 
            -|1---|-|2----|-|3---|--|4---|--|5--|---- 
            ----|6----------------------------|------ 
            ----|7------|--------------|8-------|---- 
        */
        beforeEach(async () => {
            await truncateBooking();
        });

        it('Book 10 times use case 2, Dorm should not be available', async () => {
            await bookRoomsByPeriod({ size: ROOM_TYPE_COUNT, type: 'Dorm', period: { start: '2019-08-05', end: '2019-08-08' } });
            await checkIfRoomTypesAvailable({ locationId, start, end, types: ['Private', 'Deluxe'] });
        });

        it('Book 10 times use case 3, Dorm should not be available', async () => {
            await bookRoomsByPeriod({ size: ROOM_TYPE_COUNT, type: 'Dorm', period: { start: '2019-08-09', end: '2019-08-11' } });
            await checkIfRoomTypesAvailable({ locationId, start, end, types: ['Private', 'Deluxe'] });
        });

        it('Book 10 times use case 4, Dorm should not be available', async () => {
            await bookRoomsByPeriod({ size: ROOM_TYPE_COUNT, type: 'Dorm', period: { start: '2019-08-12', end: '2019-08-15' } });
            await checkIfRoomTypesAvailable({ locationId, start, end, types: ['Private', 'Deluxe'] });
        });

        it('Book 10 times use case 6, Dorm should not be available', async () => {
            await bookRoomsByPeriod({ size: ROOM_TYPE_COUNT, type: 'Dorm', period: { start: '2019-08-06', end: '2019-08-20' } });
            await checkIfRoomTypesAvailable({ locationId, start, end, types: ['Private', 'Deluxe'] });
        });

        it('Book 10 times each use case (1,5,7,8), should not affect available', async () => {
            await bookRoomsByPeriod({ size: ROOM_TYPE_COUNT, type: 'Dorm', period: { start: '2019-08-01', end: '2019-08-3' } });
            await checkIfRoomTypesAvailable({ locationId, start, end, types: ['Dorm', 'Private', 'Deluxe'] });

            await bookRoomsByPeriod({ size: ROOM_TYPE_COUNT, type: 'Dorm', period: { start: '2019-08-21', end: '2019-08-25' } });
            await checkIfRoomTypesAvailable({ locationId, start, end, types: ['Dorm', 'Private', 'Deluxe'] });

            await bookRoomsByPeriod({ size: ROOM_TYPE_COUNT, type: 'Dorm', period: { start: '2019-08-04', end: '2019-08-7' } });
            await checkIfRoomTypesAvailable({ locationId, start, end, types: ['Dorm', 'Private', 'Deluxe'] });

            await bookRoomsByPeriod({ size: ROOM_TYPE_COUNT, type: 'Dorm', period: { start: '2019-08-14', end: '2019-08-20' } });
            await checkIfRoomTypesAvailable({ locationId, start, end, types: ['Dorm', 'Private', 'Deluxe'] });
        });
    });
});
