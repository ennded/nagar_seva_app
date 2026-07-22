import { gql } from '@apollo/client';

export const CREATE_VEHICLE = gql`
  mutation CreateVehicle($input: CreateVehicleInput!) {
    createVehicle(input: $input) {
      id
      registrationNumber
      ward {
        id
        name
      }
      driver {
        id
        name
      }
    }
  }
`;

export const ASSIGN_VEHICLE_DRIVER = gql`
  mutation AssignVehicleDriver($vehicleId: ID!, $driverId: ID!) {
    assignVehicleDriver(vehicleId: $vehicleId, driverId: $driverId) {
      id
      driver {
        id
        name
      }
    }
  }
`;

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
