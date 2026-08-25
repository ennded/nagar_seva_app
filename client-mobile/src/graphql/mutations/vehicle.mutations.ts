import { gql } from '@apollo/client';

export const START_DUTY = gql`
  mutation StartDuty {
    startDuty {
      id
      onDuty
    }
  }
`;

export const END_DUTY = gql`
  mutation EndDuty {
    endDuty {
      id
      onDuty
    }
  }
`;

export const UPDATE_VEHICLE_LOCATION = gql`
  mutation UpdateVehicleLocation($lat: Float!, $lng: Float!) {
    updateVehicleLocation(lat: $lat, lng: $lng) {
      id
      currentLat
      currentLng
      locationUpdatedAt
    }
  }
`;
