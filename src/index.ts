import {
    Canister,
    ic,
    nat64,
    Principal,
    StableBTreeMap,
    update,
    text,
    query,
    Record,
    float32,
} from 'azle';

import { v4 as uuidv4 } from 'uuid';

const Owner = Record({
    ownerID: Principal,
    ownerName: text,
    ownerCash: float32,
    createdAt: nat64,
    updatedAt: nat64
});

const Location = Record({
    locationID: Principal,
    locationName: text,
    locationPrice: float32,
    availablePercentage: float32,
    createdAt: nat64,
    updatedAt: nat64
});

const Transaction = Record({
    transactionID: Principal,
    location: Principal,
    owner: Principal,
    ownPercentage: float32,
    ownerCapital: float32,
    createdAt: nat64,
    updatedAt: nat64
});

const OwnerLocation = Record({
    ownerLocationID: Principal,
    location: Principal,
    owner: Principal,
    ownPercentage: float32,
    ownerCapital: float32,
    createdAt: nat64,
    updatedAt: nat64
});

const owners = StableBTreeMap<Principal, typeof Owner.tsType>(0);
const locations = StableBTreeMap<Principal, typeof Location.tsType>(1);
const transactions = StableBTreeMap<Principal, typeof Transaction.tsType>(2);
const ownerLocations = StableBTreeMap<Principal, typeof OwnerLocation.tsType>(3);

function generatePrincipal(): Principal {
    const uuidBytes = new TextEncoder().encode(uuidv4());
    return Principal.fromUint8Array(Uint8Array.from(uuidBytes));
}

export default Canister({
    // Construct owner, input: owner name
    createOwner: update([text], text, (ownerName) => {
        // Check if owner exists
        const isOwnerExist = owners.values().find((owner) => owner.ownerName === ownerName);

        if (isOwnerExist) {
            return "Error. Owner already exists...";
        }

        // If owner doesn't exist
        // Create a unique principal
        const ownerPrincipal = generatePrincipal();

        // Construct owner
        const owner: typeof Owner.tsType = {
            ownerID: ownerPrincipal,
            ownerName,
            ownerCash: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // Insert owner
        owners.insert(ownerPrincipal, owner);
        return `Owner has been created. Hello ${ownerName}`;
    }),

    // Construct location, input: location name and location full price
    createLocation: update([text, float32], text, (locationName, locationPrice) => {
        // Check if location exists
        const isLocationExist = locations.values().find((location) => location.locationName === locationName);
        if (isLocationExist) {
            return "Error. Location is already listed...";
        }

        // Validate price
        if (Number.isNaN(locationPrice) || locationPrice <= 0) {
            return "Error. Price is NaN or below 0...";
        }

        // Create a unique principal
        const locationPrincipal = generatePrincipal();

        // Construct location
        const location: typeof Location.tsType = {
            locationID: locationPrincipal,
            locationName,
            locationPrice,
            availablePercentage: 1,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // Insert location
        locations.insert(locationPrincipal, location);
        return `Location named ${locationName} with price = ${locationPrice} has been created.`;
    }),

    // Print all owners
    getListofOwners: query([], text, () => {
        const listofOwners = [];
        listofOwners.push("------------------ All Owner Summaries ------------------");
        listofOwners.push("Name - Cash");
        for (const owner of owners.values()) {
            listofOwners.push(`${owner.ownerName} - $${owner.ownerCash}`);
        }
        listofOwners.push("----------------------------------------------------");

        return listofOwners.join("\n");
    }),

    // Print all transactions
    getListofTransactions: query([], text, () => {
        const listofTrans = [];
        listofTrans.push("------------------ All Transaction Summaries ------------------");
        listofTrans.push("Owner - Name - Location - Location Name");
        for (const transaction of transactions.values()) {
            const owner = owners.values().find((o) => o.ownerID.toString() === transaction.owner.toString());
            const location = locations.values().find((l) => l.locationID.toString() === transaction.location.toString());
            listofTrans.push(`${transaction.owner} - ${owner?.ownerName} - ${transaction.location} - ${location?.locationName}`);
        }
        listofTrans.push("----------------------------------------------------");

        return listofTrans.join("\n");
    }),

    // Print all owner-location
    getListofOwnerLocations: query([], text, () => {
        const listofOwnerLocations = [];
        listofOwnerLocations.push("------------------ All Owner Location Summaries ------------------");
        listofOwnerLocations.push("Owner - Owner Name - Location - Location name - amount - percentage");
        for (const ownerLocation of ownerLocations.values()) {
            const owner = owners.values().find((o) => o.ownerID.toString() === ownerLocation.owner.toString());
            const location = locations.values().find((l) => l.locationID.toString() === ownerLocation.location.toString());
            listofOwnerLocations.push(`${ownerLocation.owner} - ${owner?.ownerName}  - ${ownerLocation.location} - ${location?.locationName} - $${ownerLocation.ownerCapital} - ${ownerLocation.ownPercentage * 100}%`);
        }
        listofOwnerLocations.push("----------------------------------------------------");

        return listofOwnerLocations.join("\n");
    }),

    // Print owner details, input: owner name
    getOwnerDetails: query([text], text, (ownerName) => {
        // Check if owner exists
        const owner = owners.values().find((o) => o.ownerName === ownerName);

        if (!owner) {
            return "Error. Owner does not exist...";
        }

        // If owner exists, print the details
        const ownerDetails = [];
        ownerDetails.push("------------------ Owner Details ------------------");
        ownerDetails.push("Owner ID:        ", owner.ownerID);
        ownerDetails.push("Owner Name:      ", owner.ownerName);
        ownerDetails.push("Owner Cash:$      ", owner.ownerCash);
        ownerDetails.push("Created At:     ", owner.createdAt);
        ownerDetails.push("Updated At:     ", owner.updatedAt ?? "-");
        ownerDetails.push("----------------------------------------------------");

        return ownerDetails.join("\n");
    }),

    // Print all locations
    getListofLocations: query([], text, () => {
        const listofLocations = [];
        listofLocations.push("------------------ All Location Summaries ------------------");
        listofLocations.push("Name - Price - Availability");
        for (const location of locations.values()) {
            listofLocations.push(`${location.locationName} - $${location.locationPrice} - ${location.availablePercentage * 100}%`);
        }
        listofLocations.push("----------------------------------------------------");

        return listofLocations.join("\n");
    }),

    // Print location details, input: location name
    getLocationDetails: query([text], text, (locationName) => {
        // Check if location is listed
        const location = locations.values().find((l) => l.locationName === locationName);
        if (!location) {
            return "Error. Location isn't listed...";
        }

        // If location is listed, print location details
        const locationDetails = [];
        locationDetails.push("------------------ Location Details ------------------");
        locationDetails.push(`Location ID:      ${location.locationID}`);
        locationDetails.push(`Location Name:    ${location.locationName}`);
        locationDetails.push(`Location Price:$  ${location.locationPrice}`);
        locationDetails.push(`Available Percentage: ${location.availablePercentage * 100}%`);
        locationDetails.push(`Created At:       ${location.createdAt}`);
        locationDetails.push(`Updated At:       ${location.updatedAt}`);
        locationDetails.push("----------------------------------------------------");
        return locationDetails.join("\n");
    }),

    // Top up cash for owner, input: owner name, Amount of cash
    topupCash: update([text, float32], text, (ownerName, cash) => {
        // Check if owner exists
        const owner = owners.values().find((o) => o.ownerName === ownerName);

        if (!owner) {
            return "Error. Owner does not exist...";
        }

        // Validate cash
        if (Number.isNaN(cash) || cash < 0) {
            return "Error. Cash is NaN or below 0...";
        }

        // Add cash and update updatedAt
        owner.ownerCash += cash;
        owner.updatedAt = Date.now();

        // Update owner details
        owners.insert(owner.ownerID, owner);

        return `Topup successful, your cash is $${owner.ownerCash}.`;
    }),

    // Buy location for owner, input: owner name, location name, Amount to buy
    buyLocation: update([text, text, float32], text, (buyerName, locationName, amountInDollar) => {
        // Check if owner exists
        const owner = owners.values().find((o) => o.ownerName === buyerName);

        if (!owner) {
            return "Error. Buyer does not exist...";
        }

        // Check if location is listed
        const location = locations.values().find((l) => l.locationName === locationName);

        if (!location) {
            return "Error. Location isn't listed...";
        }

        // Validate cash
        if (owner.ownerCash < amountInDollar) {
            return "Error. Buyer's cash is not sufficient...";
        }

        // Validate availability
        if (location.availablePercentage * location.locationPrice < amountInDollar) {
            return "Error. The amount desired to be purchased exceeds what is available...";
        }

        // Validate amount to buy
        if (Number.isNaN(amountInDollar) || amountInDollar <= 0) {
            return "Error. AmountInDollar is NaN or below 0...";
        }

        // Create transaction
        const ownPercentage = amountInDollar / location.locationPrice;
        const transactionPrincipal = generatePrincipal();

        const transaction: typeof Transaction.tsType = {
            transactionID: transactionPrincipal,
            location: location.locationID,
            owner: owner.ownerID,
            ownPercentage,
            ownerCapital: amountInDollar,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // Insert transaction
        transactions.insert(transactionPrincipal, transaction);

        // Create or update owner-location
        const ownLocation = ownerLocations.values().find((ownLoc) => ownLoc.owner.toString() === owner.ownerID.toString() && ownLoc.location.toString() === location.locationID.toString());

        let ownerLocationPrincipal;

        if (!ownLocation) {
            ownerLocationPrincipal = generatePrincipal();

            const ownerLocation: typeof OwnerLocation.tsType = {
                ownerLocationID: ownerLocationPrincipal,
                location: location.locationID,
                owner: owner.ownerID,
                ownPercentage,
                ownerCapital: amountInDollar,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            ownerLocations.insert(ownerLocationPrincipal, ownerLocation);
        } else {
            ownerLocationPrincipal = ownLocation.ownerLocationID;
            ownLocation.ownerCapital += amountInDollar;
            ownLocation.ownPercentage += ownPercentage;
            ownLocation.updatedAt = Date.now();

            ownerLocations.insert(ownerLocationPrincipal, ownLocation);
        }

        // Update owner details
        owner.ownerCash -= amountInDollar;
        owner.updatedAt = Date.now();

        owners.insert(owner.ownerID, owner);

        // Update location details
        location.availablePercentage -= amountInDollar / location.locationPrice;
        location.updatedAt = Date.now();

        locations.insert(location.locationID, location);

        return `Buy location successful. ${owner.ownerName} buys ${location.locationName} as much as ${transaction.ownPercentage * 100}% or $${transaction.ownerCapital}`;
    }),

    // Print transaction by owner, input: owner name
    getTransactionsbyOwner:
import {
    Canister,
    ic,
    nat64,
    Principal,
    StableBTreeMap,
    update,
    text,
    query,
    Record,
    float32,
} from 'azle';

import { v4 as uuidv4 } from 'uuid';

const Owner = Record({
    ownerID: Principal,
    ownerName: text,
    ownerCash: float32,
    createdAt: nat64,
    updatedAt: nat64
});

const Location = Record({
    locationID: Principal,
    locationName: text,
    locationPrice: float32,
    availablePercentage: float32,
    createdAt: nat64,
    updatedAt: nat64
});

const Transaction = Record({
    transactionID: Principal,
    location: Principal,
    owner: Principal,
    ownPercentage: float32,
    ownerCapital: float32,
    createdAt: nat64,
    updatedAt: nat64
});

const OwnerLocation = Record({
    ownerLocationID: Principal,
    location: Principal,
    owner: Principal,
    ownPercentage: float32,
    ownerCapital: float32,
    createdAt: nat64,
    updatedAt: nat64
});

const owners = StableBTreeMap<Principal, typeof Owner.tsType>(0);
const locations = StableBTreeMap<Principal, typeof Location.tsType>(1);
const transactions = StableBTreeMap<Principal, typeof Transaction.tsType>(2);
const ownerLocations = StableBTreeMap<Principal, typeof OwnerLocation.tsType>(3);

function generatePrincipal(): Principal {
    const uuidBytes = new TextEncoder().encode(uuidv4());
    return Principal.fromUint8Array(Uint8Array.from(uuidBytes));
}

export default Canister({
    // Construct owner, input: owner name
    createOwner: update([text], text, (ownerName) => {
        // Check if owner exists
        const isOwnerExist = owners.values().find((owner) => owner.ownerName === ownerName);

        if (isOwnerExist) {
            return "Error. Owner already exists...";
        }

        // If owner doesn't exist
        // Create a unique principal
        const ownerPrincipal = generatePrincipal();

        // Construct owner
        const owner: typeof Owner.tsType = {
            ownerID: ownerPrincipal,
            ownerName,
            ownerCash: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // Insert owner
        owners.insert(ownerPrincipal, owner);
        return `Owner has been created. Hello ${ownerName}`;
    }),

    // Construct location, input: location name and location full price
    createLocation: update([text, float32], text, (locationName, locationPrice) => {
        // Check if location exists
        const isLocationExist = locations.values().find((location) => location.locationName === locationName);
        if (isLocationExist) {
            return "Error. Location is already listed...";
        }

        // Validate price
        if (Number.isNaN(locationPrice) || locationPrice <= 0) {
            return "Error. Price is NaN or below 0...";
        }

        // Create a unique principal
        const locationPrincipal = generatePrincipal();

        // Construct location
        const location: typeof Location.tsType = {
            locationID: locationPrincipal,
            locationName,
            locationPrice,
            availablePercentage: 1,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // Insert location
        locations.insert(locationPrincipal, location);
        return `Location named ${locationName} with price = ${locationPrice} has been created.`;
    }),

    // Print all owners
    getListofOwners: query([], text, () => {
        const listofOwners = [];
        listofOwners.push("------------------ All Owner Summaries ------------------");
        listofOwners.push("Name - Cash");
        for (const owner of owners.values()) {
            listofOwners.push(`${owner.ownerName} - $${owner.ownerCash}`);
        }
        listofOwners.push("----------------------------------------------------");

        return listofOwners.join("\n");
    }),

    // Print all transactions
    getListofTransactions: query([], text, () => {
        const listofTrans = [];
        listofTrans.push("------------------ All Transaction Summaries ------------------");
        listofTrans.push("Owner - Name - Location - Location Name");
        for (const transaction of transactions.values()) {
            const owner = owners.values().find((o) => o.ownerID.toString() === transaction.owner.toString());
            const location = locations.values().find((l) => l.locationID.toString() === transaction.location.toString());
            listofTrans.push(`${transaction.owner} - ${owner?.ownerName} - ${transaction.location} - ${location?.locationName}`);
        }
        listofTrans.push("----------------------------------------------------");

        return listofTrans.join("\n");
    }),

    // Print all owner-location
    getListofOwnerLocations: query([], text, () => {
        const listofOwnerLocations = [];
        listofOwnerLocations.push("------------------ All Owner Location Summaries ------------------");
        listofOwnerLocations.push("Owner - Owner Name - Location - Location name - amount - percentage");
        for (const ownerLocation of ownerLocations.values()) {
            const owner = owners.values().find((o) => o.ownerID.toString() === ownerLocation.owner.toString());
            const location = locations.values().find((l) => l.locationID.toString() === ownerLocation.location.toString());
            listofOwnerLocations.push(`${ownerLocation.owner} - ${owner?.ownerName}  - ${ownerLocation.location} - ${location?.locationName} - $${ownerLocation.ownerCapital} - ${ownerLocation.ownPercentage * 100}%`);
        }
        listofOwnerLocations.push("----------------------------------------------------");

        return listofOwnerLocations.join("\n");
    }),

    // Print owner details, input: owner name
    getOwnerDetails: query([text], text, (ownerName) => {
        // Check if owner exists
        const owner = owners.values().find((o) => o.ownerName === ownerName);

        if (!owner) {
            return "Error. Owner does not exist...";
        }

        // If owner exists, print the details
        const ownerDetails = [];
        ownerDetails.push("------------------ Owner Details ------------------");
        ownerDetails.push("Owner ID:        ", owner.ownerID);
        ownerDetails.push("Owner Name:      ", owner.ownerName);
        ownerDetails.push("Owner Cash:$      ", owner.ownerCash);
        ownerDetails.push("Created At:     ", owner.createdAt);
        ownerDetails.push("Updated At:     ", owner.updatedAt ?? "-");
        ownerDetails.push("----------------------------------------------------");

        return ownerDetails.join("\n");
    }),

    // Print all locations
    getListofLocations: query([], text, () => {
        const listofLocations = [];
        listofLocations.push("------------------ All Location Summaries ------------------");
        listofLocations.push("Name - Price - Availability");
        for (const location of locations.values()) {
            listofLocations.push(`${location.locationName} - $${location.locationPrice} - ${location.availablePercentage * 100}%`);
        }
        listofLocations.push("----------------------------------------------------");

        return listofLocations.join("\n");
    }),

    // Print location details, input: location name
    getLocationDetails: query([text], text, (locationName) => {
        // Check if location is listed
        const location = locations.values().find((l) => l.locationName === locationName);
        if (!location) {
            return "Error. Location isn't listed...";
        }

        // If location is listed, print location details
        const locationDetails = [];
        locationDetails.push("------------------ Location Details ------------------");
        locationDetails.push(`Location ID:      ${location.locationID}`);
        locationDetails.push(`Location Name:    ${location.locationName}`);
        locationDetails.push(`Location Price:$  ${location.locationPrice}`);
        locationDetails.push(`Available Percentage: ${location.availablePercentage * 100}%`);
        locationDetails.push(`Created At:       ${location.createdAt}`);
        locationDetails.push(`Updated At:       ${location.updatedAt}`);
        locationDetails.push("----------------------------------------------------");
        return locationDetails.join("\n");
    }),

    // Top up cash for owner, input: owner name, Amount of cash
    topupCash: update([text, float32], text, (ownerName, cash) => {
        // Check if owner exists
        const owner = owners.values().find((o) => o.ownerName === ownerName);

        if (!owner) {
            return "Error. Owner does not exist...";
        }

        // Validate cash
        if (Number.isNaN(cash) || cash < 0) {
            return "Error. Cash is NaN or below 0...";
        }

        // Add cash and update updatedAt
        owner.ownerCash += cash;
        owner.updatedAt = Date.now();

        // Update owner details
        owners.insert(owner.ownerID, owner);

        return `Topup successful, your cash is $${owner.ownerCash}.`;
    }),

    // Buy location for owner, input: owner name, location name, Amount to buy
    buyLocation: update([text, text, float32], text, (buyerName, locationName, amountInDollar) => {
        // Check if owner exists
        const owner = owners.values().find((o) => o.ownerName === buyerName);

        if (!owner) {
            return "Error. Buyer does not exist...";
        }

        // Check if location is listed
        const location = locations.values().find((l) => l.locationName === locationName);

        if (!location) {
            return "Error. Location isn't listed...";
        }

        // Validate cash
        if (owner.ownerCash < amountInDollar) {
            return "Error. Buyer's cash is not sufficient...";
        }

        // Validate availability
        if (location.availablePercentage * location.locationPrice < amountInDollar) {
            return "Error. The amount desired to be purchased exceeds what is available...";
        }

        // Validate amount to buy
        if (Number.isNaN(amountInDollar) || amountInDollar <= 0) {
            return "Error. AmountInDollar is NaN or below 0...";
        }

        // Create transaction
        const ownPercentage = amountInDollar / location.locationPrice;
        const transactionPrincipal = generatePrincipal();

        const transaction: typeof Transaction.tsType = {
            transactionID: transactionPrincipal,
            location: location.locationID,
            owner: owner.ownerID,
            ownPercentage,
            ownerCapital: amountInDollar,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // Insert transaction
        transactions.insert(transactionPrincipal, transaction);

        // Create or update owner-location
        const ownLocation = ownerLocations.values().find((ownLoc) => ownLoc.owner.toString() === owner.ownerID.toString() && ownLoc.location.toString() === location.locationID.toString());

        let ownerLocationPrincipal;

        if (!ownLocation) {
            ownerLocationPrincipal = generatePrincipal();

            const ownerLocation: typeof OwnerLocation.tsType = {
                ownerLocationID: ownerLocationPrincipal,
                location: location.locationID,
                owner: owner.ownerID,
                ownPercentage,
                ownerCapital: amountInDollar,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            ownerLocations.insert(ownerLocationPrincipal, ownerLocation);
        } else {
            ownerLocationPrincipal = ownLocation.ownerLocationID;
            ownLocation.ownerCapital += amountInDollar;
            ownLocation.ownPercentage += ownPercentage;
            ownLocation.updatedAt = Date.now();

            ownerLocations.insert(ownerLocationPrincipal, ownLocation);
        }

        // Update owner details
        owner.ownerCash -= amountInDollar;
        owner.updatedAt = Date.now();

        owners.insert(owner.ownerID, owner);

        // Update location details
        location.availablePercentage -= amountInDollar / location.locationPrice;
        location.updatedAt = Date.now();

        locations.insert(location.locationID, location);

        return `Buy location successful. ${owner.ownerName} buys ${location.locationName} as much as ${transaction.ownPercentage * 100}% or $${transaction.ownerCapital}`;
    }),

    // Print transaction by owner, input: owner name
    getTransactionsbyOwner:    query([text], text, (ownerName) => {
        // Check if owner exists
        const owner = owners.values().find((o) => o.ownerName === ownerName);

        if (!owner) {
            return "Error. Owner does not exist...";
        }

        // If owner exists, print the transactions
        const transactionsByOwner = [];
        transactionsByOwner.push(`------------------ Transactions for ${ownerName} ------------------`);
        transactionsByOwner.push("Location - Location Name - Percentage - Amount - Date");
        
        for (const transaction of transactions.values()) {
            if (transaction.owner.toString() === owner.ownerID.toString()) {
                const location = locations.values().find((l) => l.locationID.toString() === transaction.location.toString());
                transactionsByOwner.push(`${transaction.location} - ${location?.locationName} - ${transaction.ownPercentage * 100}% - $${transaction.ownerCapital} - ${new Date(transaction.createdAt)}`);
            }
        }

        transactionsByOwner.push("----------------------------------------------------");

        return transactionsByOwner.join("\n");
    }),

    // Withdraw cash for owner, input: owner name, Amount of cash
    withdrawCash: update([text, float32], text, (ownerName, cash) => {
        // Check if owner exists
        const owner = owners.values().find((o) => o.ownerName === ownerName);

        if (!owner) {
            return "Error. Owner does not exist...";
        }

        // Validate cash
        if (Number.isNaN(cash) || cash <= 0) {
            return "Error. Cash is NaN or below 0...";
        }

        // Check if owner has enough cash
        if (owner.ownerCash < cash) {
            return "Error. Insufficient funds...";
        }

        // Update owner details
        owner.ownerCash -= cash;
        owner.updatedAt = Date.now();

        owners.insert(owner.ownerID, owner);

        return `Withdrawal successful. Your cash is now $${owner.ownerCash}.`;
    }),

    // Sell location for owner, input: owner name, location name, Amount to sell
    sellLocation: update([text, text, float32], text, (sellerName, locationName, amountInDollar) => {
        // Check if owner exists
        const owner = owners.values().find((o) => o.ownerName === sellerName);

        if (!owner) {
            return "Error. Seller does not exist...";
        }

        // Check if location is listed
        const location = locations.values().find((l) => l.locationName === locationName);

        if (!location) {
            return "Error. Location isn't listed...";
        }

        // Validate amount to sell
        if (Number.isNaN(amountInDollar) || amountInDollar <= 0) {
            return "Error. AmountInDollar is NaN or below 0...";
        }

        // Check if owner has enough owned percentage to sell
        const ownerLocation = ownerLocations.values().find((ownLoc) => ownLoc.owner.toString() === owner.ownerID.toString() && ownLoc.location.toString() === location.locationID.toString());

        if (!ownerLocation || ownerLocation.ownPercentage < amountInDollar / location.locationPrice) {
            return "Error. Insufficient ownership...";
        }

        // Create transaction
        const ownPercentage = amountInDollar / location.locationPrice;
        const transactionPrincipal = generatePrincipal();

        const transaction: typeof Transaction.tsType = {
            transactionID: transactionPrincipal,
            location: location.locationID,
            owner: owner.ownerID,
            ownPercentage,
            ownerCapital: amountInDollar,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        // Insert transaction
        transactions.insert(transactionPrincipal, transaction);

        // Update owner-location details
        ownerLocation.ownerCapital -= amountInDollar;
        ownerLocation.ownPercentage -= ownPercentage;
        ownerLocation.updatedAt = Date.now();

        ownerLocations.insert(ownerLocation.ownerLocationID, ownerLocation);

        // Update owner details
        owner.ownerCash += amountInDollar;
        owner.updatedAt = Date.now();

        owners.insert(owner.ownerID, owner);

        // Update location details
        location.availablePercentage += amountInDollar / location.locationPrice;
        location.updatedAt = Date.now();

        locations.insert(location.locationID, location);

        return `Sell location successful. ${sellerName} sells ${location.locationName} for ${amountInDollar}.`;
    }),

    // Set availability for location, input: location name, new availability percentage
    setLocationAvailability: update([text, float32], text, (locationName, newAvailability) => {
        // Check if location is listed
        const location = locations.values().find((l) => l.locationName === locationName);

        if (!location) {
            return "Error. Location isn't listed...";
        }

        // Validate new availability
        if (Number.isNaN(newAvailability) || newAvailability < 0 || newAvailability > 1) {
            return "Error. New availability is NaN, below 0, or above 1...";
        }

        // Update location details
        location.availablePercentage = newAvailability;
        location.updatedAt = Date.now();

        locations.insert(location.locationID, location);

        return `Set availability for ${locationName} to ${newAvailability * 100}%.`;
    }),

    // Set ownership percentage for owner-location, input: owner name, location name, new ownership percentage
    setOwnershipPercentage: update([text, text, float32], text, (ownerName, locationName, newOwnershipPercentage) => {
        // Check if owner exists
        const owner = owners.values().find((o) => o.ownerName === ownerName);

        if (!owner) {
            return "Error. Owner does not exist...";
        }

        // Check if location is listed
        const location = locations.values().find((l) => l.locationName === locationName);

        if (!location) {
            return "Error. Location isn't listed...";
        }

        // Validate new ownership percentage
        if (Number.isNaN(newOwnershipPercentage) || newOwnershipPercentage < 0 || newOwnershipPercentage > 1) {
            return "Error. New ownership percentage is NaN, below 0, or above 1...";
        }

        // Check if owner-location exists
        const ownerLocation = ownerLocations.values().find((ownLoc) => ownLoc.owner.toString() === owner.ownerID.toString() && ownLoc.location.toString() === location.locationID.toString());

        if (!ownerLocation) {
            return "Error. Owner does not own this location...";
        }

        // Update owner-location details
        ownerLocation.ownPercentage = newOwnershipPercentage;
        ownerLocation.updatedAt = Date.now();

        ownerLocations.insert(ownerLocation.ownerLocationID, ownerLocation);

        return `Set ownership percentage for ${ownerName} in ${locationName} to ${newOwnershipPercentage * 100}%.`;
    }),

    // Delete location, input: location name
    deleteLocation: update([text], text, (locationName) => {
        // Check if location is listed
        const location = locations.values().find((l) => l.locationName === locationName);

        if (!location) {
            return "Error. Location isn't listed...";
        }

        // Delete location
        locations.delete(location.locationID);

        // Delete related transactions
        for (const transaction of transactions.values()) {
            if (transaction.location.toString() === location.locationID.toString()) {
                transactions.delete(transaction.transactionID);
            }
        }

        // Delete related owner-locations
        for (const ownerLocation of ownerLocations.values()) {
            if (ownerLocation.location.toString() === location.locationID.toString()) {
                ownerLocations.delete(ownerLocation.ownerLocationID);
            }
        }

        return `Location ${locationName} has been deleted.`;
    }),

    // Delete owner, input: owner name
    deleteOwner: update([text], text, (ownerName) => {
        // Check if owner exists
        const owner = owners.values().find((o) => o.ownerName === ownerName);

        if (!owner) {
            return "Error. Owner does not exist...";
        }

        // Delete owner
        owners.delete(owner.ownerID);

        // Delete related transactions
        for (const transaction of transactions.values()) {
            if (transaction.owner.toString() === owner.ownerID.toString()) {
                transactions.delete(transaction.transactionID);
            }
        }

        // Delete related owner-locations
        for (const ownerLocation of ownerLocations.values()) {
            if (ownerLocation.owner.toString() === owner.ownerID.toString()) {
                ownerLocations.delete(ownerLocation.ownerLocationID);
            }
        }

        return `Owner ${ownerName} has been deleted.`;
    }),

    // Delete transaction, input: owner name, location name, transaction amount
    deleteTransaction: update([text, text, float32], text, (ownerName, locationName, amount) => {
        // Check if owner exists
        const owner = owners.values().find((o) => o.ownerName === ownerName);

        if (!owner) {
            return "Error. Owner does not exist...";
        }

        // Check if location is listed
        const location = locations.values().find((l) => l.locationName === locationName);

        if (!location) {
            return "Error. Location isn't listed...";
        }

        // Validate amount to delete
        if (Number.isNaN(amount) || amount <= 0) {
            return "Error. Amount is NaN or below 0...";
        }

        // Find and delete transaction
        for (const transaction of transactions.values()) {
            if (
                transaction.owner.toString() === owner.ownerID.toString() &&
                transaction.location.toString() === location.locationID.toString() &&
                transaction.ownerCapital === amount
            ) {
                transactions.delete(transaction.transactionID);

                // Update owner-location details
                const ownerLocation = ownerLocations.values().find((ownLoc) => ownLoc.owner.toString() === owner.ownerID.toString() && ownLoc.location.toString() === location.locationID.toString());

                if (ownerLocation) {
                    ownerLocation.ownerCapital -= amount;
                    ownerLocation.ownPercentage -= amount / location.locationPrice;
                    ownerLocation.updatedAt = Date.now();

                    ownerLocations.insert(ownerLocation.ownerLocationID, ownerLocation);
                }

                // Update owner details
                owner.ownerCash += amount;
                owner.updatedAt = Date.now();

                owners.insert(owner.ownerID, owner);

                // Update location details
                location.availablePercentage += amount / location.locationPrice;
                location.updatedAt = Date.now();

                locations.insert(location.locationID, location);

                return `Transaction of amount $${amount} has been deleted.`;
            }
        }

        return "Error. Transaction not found...";
    })
});
