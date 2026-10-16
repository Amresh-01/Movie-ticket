/**
 * Auditorium Geometry & Optical Configuration for Yozigo 3D Cinema Simulator
 */

export interface SeatCoordinate {
  id: string;
  row: string;
  number: number;
  position: [number, number, number];
  eyePosition: [number, number, number];
  rotationY: number;
}

export interface ViewingMetrics {
  straightDistanceMeters: number;
  horizontalAngleDeg: number;
  verticalAngleDeg: number;
  fieldOfViewCoveragePercent: number;
  frustumFit: boolean;
  perspectiveRating: 'Center Immersion' | 'Balanced Prime' | 'Front Impact' | 'Rear Panoramic' | 'Wide Angled';
}

export const CINEMA_CONFIG = {
  screen: {
    width: 14.2,
    height: 5.2,
    position: [0, 3.2, -8.2] as [number, number, number],
    center: [0, 3.2, -8.2] as [number, number, number],
  },
  rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  seatsPerRow: 10,
  rowElevationStep: 0.35,
  rowZSpacing: 1.35,
  rowZStart: -4.5,
  seatedEyeHeight: 0.95, // Height from seat base to average viewer's eye level
};

/**
 * Mathematically generates the 80 auditorium seat coordinates.
 * Left Block (Seats 1-5): x = -3.8 to -0.6
 * Center Aisle Gap: between -0.6 and +0.6 (1.2m aisle)
 * Right Block (Seats 6-10): x = +0.6 to +3.8
 */
export const generateSeatCoordinates = (): SeatCoordinate[] => {
  const coords: SeatCoordinate[] = [];

  CINEMA_CONFIG.rows.forEach((rowLetter, rowIndex) => {
    const z = CINEMA_CONFIG.rowZStart + rowIndex * CINEMA_CONFIG.rowZSpacing;
    const y = rowIndex * CINEMA_CONFIG.rowElevationStep + 0.05;

    for (let seatNumber = 1; seatNumber <= CINEMA_CONFIG.seatsPerRow; seatNumber++) {
      let x = 0;
      if (seatNumber <= 5) {
        x = -3.8 + (seatNumber - 1) * 0.8;
      } else {
        x = 0.6 + (seatNumber - 6) * 0.8;
      }

      // Orientation slightly angled toward screen center
      const rotationY = -x * 0.035;

      // Seated viewer eye position (above seat base)
      const eyePosition: [number, number, number] = [
        x,
        y + CINEMA_CONFIG.seatedEyeHeight,
        z + 0.05,
      ];

      coords.push({
        id: `${rowLetter}${seatNumber}`,
        row: rowLetter,
        number: seatNumber,
        position: [x, y, z],
        eyePosition,
        rotationY,
      });
    }
  });

  return coords;
};

/**
 * Calculates genuine geometric viewing metrics from seated eye position to the cinema screen.
 */
export const calculateViewingMetrics = (
  eyePos: [number, number, number],
  screenCenter = CINEMA_CONFIG.screen.center,
  screenWidth = CINEMA_CONFIG.screen.width,
  _screenHeight = CINEMA_CONFIG.screen.height
): ViewingMetrics => {
  const dx = screenCenter[0] - eyePos[0];
  const dy = screenCenter[1] - eyePos[1];
  const dz = screenCenter[2] - eyePos[2];

  // Straight line 3D euclidean distance in meters
  const straightDistanceMeters = Math.hypot(dx, dy, dz);

  // Horizontal angle relative to normal screen perpendicular (dz is forward)
  const horizontalAngleRad = Math.atan2(Math.abs(dx), Math.abs(dz));
  const horizontalAngleDeg = Math.round((horizontalAngleRad * 180) / Math.PI);

  // Vertical viewing elevation angle from eye up/down to screen center
  const verticalAngleRad = Math.atan2(dy, Math.hypot(dx, dz));
  const verticalAngleDeg = Math.round((verticalAngleRad * 180) / Math.PI);

  // Apparent horizontal angular size of the screen
  const screenAngleH = 2 * Math.atan((screenWidth / 2) / straightDistanceMeters);
  const screenAngleDeg = (screenAngleH * 180) / Math.PI;

  // Camera standard horizontal field of view (~60 deg equivalent)
  const coveragePercent = Math.min(100, Math.round((screenAngleDeg / 60) * 100));

  // Determine realistic viewing perspective rating
  let perspectiveRating: ViewingMetrics['perspectiveRating'] = 'Balanced Prime';
  const zDist = Math.abs(dz);

  if (zDist < 5.0) {
    perspectiveRating = 'Front Impact';
  } else if (zDist > 9.0) {
    perspectiveRating = 'Rear Panoramic';
  } else if (Math.abs(dx) > 2.5) {
    perspectiveRating = 'Wide Angled';
  } else if (Math.abs(dx) <= 1.2) {
    perspectiveRating = 'Center Immersion';
  }

  return {
    straightDistanceMeters: Number(straightDistanceMeters.toFixed(1)),
    horizontalAngleDeg,
    verticalAngleDeg,
    fieldOfViewCoveragePercent: coveragePercent,
    frustumFit: screenAngleDeg <= 65,
    perspectiveRating,
  };
};
