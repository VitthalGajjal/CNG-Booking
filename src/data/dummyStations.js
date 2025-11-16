// This is initial dummy data. Stations will primarily be stored in Firestore.
// The `slots` array here is just for illustrative purposes; real slot data
// will be dynamically managed in Firestore.

export const dummyStations = [
  { id: 'station001', name: 'HP CNG Station - Bandra', distance: '2.5 km', status: 'open' },
  { id: 'station002', name: 'BPCL CNG Pump - Andheri', distance: '4.8 km', status: 'open' },
  { id: 'station003', name: 'Indian Oil CNG - Powai', distance: '6.3 km', status: 'closed' },
  { id: 'station004', name: 'Reliance CNG - Thane', distance: '8.0 km', status: 'open' },
];