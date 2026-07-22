import { gql } from '@apollo/client';
import { USER_FIELDS } from '../fragments';

const VEHICLE_FIELDS = gql`
  fragment VehicleFields on Vehicle {
    id
    registrationNumber
    onDuty
    currentLat
    currentLng
    locationUpdatedAt
    ward {
      id
      name
      code
    }
    driver {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const VEHICLES_BY_CITY = gql`
  query VehiclesByCity {
    vehiclesByCity {
      ...VehicleFields
    }
  }
  ${VEHICLE_FIELDS}
`;

export const MY_VEHICLE = gql`
  query MyVehicle {
    myVehicle {
      ...VehicleFields
    }
  }
  ${VEHICLE_FIELDS}
`;

export const MY_WARD_VEHICLE = gql`
  query MyWardVehicle {
    myWardVehicle {
      ...VehicleFields
    }
  }
  ${VEHICLE_FIELDS}
`;
