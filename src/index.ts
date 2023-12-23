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
})

const Location = Record({
    locationID: Principal,
    locationName: text,
    locationPrice: float32,
    availablePercentage: float32,
    createdAt: nat64,
    updatedAt: nat64
})

const Transaction = Record({
    transactionID: Principal,
    location: Principal,
    owner: Principal,
    ownPercentage: float32,
    ownerCapital: float32,
    createdAt: nat64,
    updatedAt: nat64
})

const OwnerLocation = Record({
    ownerLocationID: Principal,
    location: Principal,
    owner: Principal,
    ownPercentage: float32,
    ownerCapital: float32,
    createdAt: nat64,
    updatedAt: nat64
})

const owners = StableBTreeMap<Principal, typeof Owner.tsType>(0);
const locations = StableBTreeMap<Principal, typeof Location.tsType>(1);
const transactions = StableBTreeMap<Principal, typeof Transaction.tsType>(2);
const ownerLocations = StableBTreeMap<Principal, typeof OwnerLocation.tsType>(3);

function generatePrincipal(): Principal {
    let uuidBytes = new TextEncoder(). encode(uuidv4());

    return Principal.fromUint8Array(Uint8Array.from(uuidBytes));
}
  

export default Canister({

    // construct owner, input: owner name
    createOwner: update([text], text, (ownerName) => {

        // check if owner exist
        const isOwnerExist = owners.values().filter((owner) => owner.ownerName === ownerName)[0];

        if (isOwnerExist) return ("Error. Owner already exist...");

        // if owner isn't exist
        // create a unique principal
        const ownerPrincipal = generatePrincipal();

        // construct owner
        const owner: typeof Owner.tsType = {
            ownerID: ownerPrincipal,
            ownerName: ownerName,
            ownerCash: 0,
            createdAt: ic.time(),
            updatedAt: ic.time()
        }

        // insert owner
        owners.insert(ownerPrincipal, owner);
        return (`Owner has been created. Hello ${ownerName}`)

    }),

    // construct location, input: location name and location full price
    createLocation: update([text, float32], text, (locationName, locationPrice) => {

        // check if location exist
        const isLocationExist = locations.values().filter((location) => location.locationName === locationName)[0];
        if (isLocationExist) return ("Error. Location is already listed...");

        // validate price
        if (Number.isNaN(locationPrice) || locationPrice <=0) return ("Error. Price is NaN or below 0...");

        // create a unique principal
        const locationPrincipal = generatePrincipal();

        // construct owner
        const location: typeof Location.tsType = {
            locationID: locationPrincipal,
            locationName: locationName,
            locationPrice: locationPrice,
            // locationOwners: [],
            availablePercentage: 1,
            createdAt: ic.time(),
            updatedAt: ic.time()
        }

        // insert location
        locations.insert(locationPrincipal, location);
        return (`Location named ${locationName} with price = ${locationPrice} has been created.`)

    }),

    // print all owners
    getListofOwners:query([], text, () => {

        const listofOwners = [];
        listofOwners.push("------------------ All Owner Summaries ------------------");
        listofOwners.push("Name - Cash");
        for (const owner of owners.values()) {
            listofOwners.push(`${owner.ownerName} - $${owner.ownerCash}`);
        }
        listofOwners.push("----------------------------------------------------");

        return listofOwners.join("\n");
          
    }),

    // print all transactions
    getListofTransactions:query([], text, () => {

        const listofTrans = [];
        listofTrans.push("------------------ All Transaction Summaries ------------------");
        listofTrans.push("Owner - Name - Location - Location Name");
        for (const transaction of transactions.values()) {
            const owner = owners.values().filter((owner) => owner.ownerID.toString() === transaction.owner.toString())[0];
            const location = locations.values().filter((location) => location.locationID.toString() === transaction.location.toString())[0];
            listofTrans.push(`${transaction.owner} - ${owner.ownerName} - ${transaction.location} - ${location.locationName}`);
        }
        listofTrans.push("----------------------------------------------------");

        return listofTrans.join("\n");
          
    }),

    // print all owner-location
    getListofOwnerLocations:query([], text, () => {

        const listofOwnerLocations = [];
        listofOwnerLocations.push("------------------ All Owner Location Summaries ------------------");
        listofOwnerLocations.push("Owner - Owner Name - Location - Location name - amount - percentage");
        for (const ownerLocation of ownerLocations.values()) {
            const owner = owners.values().filter((owner) => owner.ownerID.toString() === ownerLocation.owner.toString())[0];
            const location = locations.values().filter((location) => location.locationID.toString() === ownerLocation.location.toString())[0];
            listofOwnerLocations.push(`${ownerLocation.owner} - ${owner.ownerName}  - ${ownerLocation.location} - ${location.locationName} - $${ownerLocation.ownerCapital} - ${ownerLocation.ownPercentage*100}%`);
        }
        listofOwnerLocations.push("----------------------------------------------------");

        return listofOwnerLocations.join("\n");
          
    }),

    // print owner details, input: owner name
    getOwnerDetails:query([text], text, (ownerName) => {

        // check if owner exist
        const owner = owners.values().filter((owner) => owner.ownerName === ownerName)[0];

        if (!owner) return ("Error. Owner is not exist...");

        // if owner exist, print the details
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

    // print all locations
    getListofLocations:query([], text, () => {

        const listofLocations = [];
        listofLocations.push("------------------ All Location Summaries ------------------");
        listofLocations.push("Name - Price - Availability");
        for (const location of locations.values()) {
            listofLocations.push(`${location.locationName} - $${location.locationPrice} - ${location.availablePercentage*100}%`);
        }
        listofLocations.push("----------------------------------------------------");

        return listofLocations.join("\n");
          
    }),

    // print location details, input: location name
    getLocationDetails:query([text], text, (locationName) => {

        // check if location listed
        const location = locations.values().filter((location) => location.locationName === locationName)[0];
        if (!location) return ("Error. Location isn't listed...");

        // if location listed, print location details
        const locationDetails = [];
        locationDetails.push("------------------ Location Details ------------------");
        locationDetails.push(`Location ID:      ${location.locationID}`);
        locationDetails.push(`Location Name:    ${location.locationName}`);
        locationDetails.push(`Location Price:$  ${location.locationPrice}`);
        locationDetails.push(`Available Percentage: ${location.availablePercentage*100}%`);
        locationDetails.push(`Created At:       ${location.createdAt}`);
        locationDetails.push(`Updated At:       ${location.updatedAt}`);
        locationDetails.push("----------------------------------------------------");
        return locationDetails.join("\n");
        
    }),

    // top up cash for owner, input: owner name, Amount of cash
    topupCash: update([text, float32], text, (ownerName, cash) => {

        // check if owner exist
        const owner = owners.values().filter((owner) => owner.ownerName === ownerName)[0];

        if (!owner) return ("Error. Owner is not exist...");

        // validate cash
        if (Number.isNaN(cash) || cash <0) return ("Error. Cash is NaN or below 0...");

        // add cash and update updateAt
        owner.ownerCash += cash;
        owner.updatedAt = ic.time();

        // update owner details
        owners.insert(owner.ownerID, owner); 

        return (` Topup successfull, your cash is $${owner.ownerCash}.`)

    }),
    
    // buy location for owner, input: owner name, location name, Amount to buy
    buyLocation: update([text, text, float32], text, (buyerName, locationName, amountInDollar) => {

        // check if owner exist
        const owner = owners.values().filter((owner) => owner.ownerName === buyerName)[0];

        if (!owner) return ("Error. Buyer is not exist...");

        // check if location listed
        const location = locations.values().filter((location) => location.locationName === locationName)[0];

        if (!location) return ("Error. Location isn't listed...");

        // validate cash
        if (owner.ownerCash < amountInDollar) return ("Error. Buyer's cash is not sufficient...");

        // validate availability
        if ((location.availablePercentage * location.locationPrice) < amountInDollar) return ("Error. The amount desired to be purchased exceeds what is available...");

        // validate amount to buy
        if (Number.isNaN(amountInDollar) || amountInDollar <=0) return ("Error. AmountInDollar is NaN or below 0...");

        // create transaction
        let ownPercentage = amountInDollar/location.locationPrice;

        const transactionPrincipal = generatePrincipal();
        
        const transaction: typeof Transaction.tsType = {
            transactionID: transactionPrincipal,
            location: location.locationID,
            owner: owner.ownerID,
            ownPercentage:ownPercentage,
            ownerCapital: amountInDollar,
            createdAt: ic.time(),
            updatedAt: ic.time()
        }

        // insert transaction
        transactions.insert(transactionPrincipal, transaction);

        // create or update owner-location
        const ownLocation = ownerLocations.values().filter((ownLoc) => ownLoc.owner.toString() === owner.ownerID.toString() && ownLoc.location.toString() === location.locationID.toString() )[0];

        let ownerLocationPrincipal;

        if (!ownLocation){
            ownerLocationPrincipal = generatePrincipal();

            const ownerLocation: typeof OwnerLocation.tsType = {
                ownerLocationID: ownerLocationPrincipal,
                location: location.locationID,
                owner: owner.ownerID,
                ownPercentage: ownPercentage,
                ownerCapital: amountInDollar,
                createdAt: ic.time(),
                updatedAt: ic.time()
            }

            ownerLocations.insert(ownerLocationPrincipal, ownerLocation);
        } else {
            ownerLocationPrincipal = ownLocation.ownerLocationID;
            ownLocation.ownerCapital += amountInDollar;
            ownLocation.ownPercentage += ownPercentage;
            ownLocation.updatedAt = ic.time();

            ownerLocations.insert(ownerLocationPrincipal, ownLocation);
        }

        // update owner details
        owner.ownerCash -= amountInDollar;
        owner.updatedAt = ic.time();

        owners.insert(owner.ownerID, owner); 

        // update location details
        location.availablePercentage -= amountInDollar/location.locationPrice;
        location.updatedAt = ic.time();

        locations.insert(location.locationID, location);

        return (`Buy location successfull. ${owner.ownerName} buy ${location.locationName} as much as ${transaction.ownPercentage*100}% or $${transaction.ownerCapital}`)

    }),

    // print transaction by owner, input: owner name
    getTransactionsbyOwner: query([text], text, (ownerName) => {

        // check if owner exist
        const owner = owners.values().filter((owner) => owner.ownerName === ownerName)[0];

        if (!owner) return ("Error. Owner is not exist...");

        // if exist, print all transactions done by owner
        const transactionDetails = [];

        for (const transaction of transactions.values()) {
            if (transaction.owner.toString() === owner.ownerID.toString()){
                const location = locations.values().filter((location) => location.locationID.toString() === transaction.location.toString())[0];
                transactionDetails.push("------------------ Transaction Details ------------------");
                transactionDetails.push(`Transaction ID: ${transaction.transactionID}`);
                transactionDetails.push(`Location: ${transaction.location}`);
                transactionDetails.push(`Location Name: ${location.locationName}`);
                transactionDetails.push(`Owner: ${transaction.owner}`);
                transactionDetails.push(`Owner Name: ${owner.ownerName}`);
                transactionDetails.push(`Owner Percantage: ${transaction.ownPercentage*100}%`);
                transactionDetails.push(`Owner Capital: $${transaction.ownerCapital}`);
                transactionDetails.push(`Created At: ${transaction.createdAt}`);
                transactionDetails.push(`Updated At: ${transaction.updatedAt}`);
                transactionDetails.push("----------------------------------------------------");
                transactionDetails.push("\n");
            }
        }

        return transactionDetails.join("\n");

    }),

    // print transaction by location, input: location name
    getTransactionsbyLocation: query([text], text, (locationName) => {

        // check if location listed
        const location = locations.values().filter((location) => location.locationName === locationName)[0];
        if (!location) return ("Error. Location isn't listed...");

        // if location listed, print all transactions done on the location
        const transactionDetails = [];

        for (const transaction of transactions.values()) {
            if (transaction.location.toString() === location.locationID.toString()){
                const owner = owners.values().filter((owner) => owner.ownerID.toString() === transaction.owner.toString())[0];
                transactionDetails.push("------------------ Transaction Details ------------------");
                transactionDetails.push(`Transaction ID: ${transaction.transactionID}`);
                transactionDetails.push(`Location:" ${transaction.location}`);
                transactionDetails.push(`Location Name: ${location.locationName}`);
                transactionDetails.push(`Owner: ${transaction.owner}`);
                transactionDetails.push(`Owner Name: ${owner.ownerName}`);
                transactionDetails.push(`Owner Percantage: ${transaction.ownPercentage*100}%`);
                transactionDetails.push(`Owner Capital: $${transaction.ownerCapital}`);
                transactionDetails.push(`Created At: ${transaction.createdAt}`);
                transactionDetails.push(`Updated At: ${transaction.updatedAt}`);
                transactionDetails.push("----------------------------------------------------");
                transactionDetails.push("\n");
            }
        }

        return transactionDetails.join("\n");
        
    }),

    // print transaction by owner and location, input: owner name, location name
    getTransactionsbyOwnerAndLocation: query([text, text], text, (ownerName, locationName) => {

        // check if owner exist
        const owner = owners.values().filter((owner) => owner.ownerName === ownerName)[0];

        if (!owner) return ("Error. Owner is not exist...");

        // check if location listed
        const location = locations.values().filter((location) => location.locationName === locationName)[0];

        if (!location) return ("Error. Location isn't listed...");

        // if exist & listed, print all transactions done by owner and on the location
        const transactionDetails= [];
        
        for (const transaction of transactions.values()) {
            if (transaction.location.toString() === location.locationID.toString() && transaction.owner.toString() === owner.ownerID.toString()){
                transactionDetails.push("------------------ Transaction Details ------------------");
                transactionDetails.push(`Transaction ID: ${transaction.transactionID}`);
                transactionDetails.push(`Location:" ${transaction.location}`);
                transactionDetails.push(`Location Name: ${location.locationName}`);
                transactionDetails.push(`Owner: ${transaction.owner}`);
                transactionDetails.push(`Owner Name: ${owner.ownerName}`);
                transactionDetails.push(`Owner Percantage: ${transaction.ownPercentage*100}%`);
                transactionDetails.push(`Owner Capital: $${transaction.ownerCapital}`);
                transactionDetails.push(`Created At: ${transaction.createdAt}`);
                transactionDetails.push(`Updated At: ${transaction.updatedAt}`);
                transactionDetails.push("----------------------------------------------------");
                transactionDetails.push("\n");
            }
        }

        return transactionDetails.join("\n");
    }),

    // print owner-location by owner, input: owner name
    getOwnerLocationsbyOwner: query([text], text, (ownerName) => {

        //check if owner exist
        const owner = owners.values().filter((owner) => owner.ownerName === ownerName)[0];

        if (!owner) return ("Error. Owner is not exist...");

        // if exist, print all owner-location done by owner
        const ownerLocationDetails = [];

        for (const ownerLocation of ownerLocations.values()) {
            if (ownerLocation.owner.toString() === owner.ownerID.toString()){
                const location = locations.values().filter((location) => location.locationID.toString() === ownerLocation.location.toString())[0];
                ownerLocationDetails.push("------------------ Owner Location Details ------------------");
                ownerLocationDetails.push(`OwnerLocation ID: ${ownerLocation.ownerLocationID}`);
                ownerLocationDetails.push(`Location:" ${ownerLocation.location}`);
                ownerLocationDetails.push(`Location Name: ${location.locationName}`);
                ownerLocationDetails.push(`Owner: ${ownerLocation.owner}`);
                ownerLocationDetails.push(`Owner Name: ${owner.ownerName}`);
                ownerLocationDetails.push(`Owner Percantage: ${ownerLocation.ownPercentage*100}%`);
                ownerLocationDetails.push(`Owner Capital: $${ownerLocation.ownerCapital}`);
                ownerLocationDetails.push(`Created At: ${ownerLocation.createdAt}`);
                ownerLocationDetails.push(`Updated At: ${ownerLocation.updatedAt}`);
                ownerLocationDetails.push("----------------------------------------------------");
                ownerLocationDetails.push("\n");
            }
        }

        return ownerLocationDetails.join("\n");

    }),

    // print owner-location on location, input: location name
    getOwnerLocationsbyLocation: query([text], text, (locationName) => {

        // check if location listed
        const location = locations.values().filter((location) => location.locationName === locationName)[0];
        if (!location) return ("Error. Location isn't listed...");

        // if listed, print all owner-location done on the location
        const ownerLocationDetails = [];

        for (const ownerLocation of ownerLocations.values()) {
            if (ownerLocation.location.toString() === location.locationID.toString()){
                const owner = owners.values().filter((owner) => owner.ownerID.toString() === ownerLocation.owner.toString())[0];
                ownerLocationDetails.push("------------------ Owner Location Details ------------------");
                ownerLocationDetails.push(`OwnerLocation ID: ${ownerLocation.ownerLocationID}`);
                ownerLocationDetails.push(`Location:" ${ownerLocation.location}`);
                ownerLocationDetails.push(`Location Name: ${location.locationName}`);
                ownerLocationDetails.push(`Owner: ${ownerLocation.owner}`);
                ownerLocationDetails.push(`Owner Name: ${owner.ownerName}`);
                ownerLocationDetails.push(`Owner Percantage: ${ownerLocation.ownPercentage*100}%`);
                ownerLocationDetails.push(`Owner Capital: $${ownerLocation.ownerCapital}`);
                ownerLocationDetails.push(`Created At: ${ownerLocation.createdAt}`);
                ownerLocationDetails.push(`Updated At: ${ownerLocation.updatedAt}`);
                ownerLocationDetails.push("----------------------------------------------------");
                ownerLocationDetails.push("\n");
            }
        }

        return ownerLocationDetails.join("\n");
        
    }),

    // print all owner-location by owner & location, input: owner name, location name
    getOwnerLocationsbyOwnerAndLocation: query([text, text], text, (ownerName, locationName) => {

        // check if owner exist
        const owner = owners.values().filter((owner) => owner.ownerName === ownerName)[0];

        if (!owner) return ("Error. Owner is not exist...");

        // check if location listed
        const location = locations.values().filter((location) => location.locationName === locationName)[0];

        if (!location) return ("Error. Location isn't listed...");

        // if exist & listed, print all owner-location done by owner & on the location
        const ownerLocationDetails = [];

        for (const ownerLocation of ownerLocations.values()) {
            if (ownerLocation.location.toString() === location.locationID.toString() && ownerLocation.owner.toString() === owner.ownerID.toString()){
                ownerLocationDetails.push("------------------ Owner Location Details ------------------");
                ownerLocationDetails.push(`OwnerLocation ID: ${ownerLocation.ownerLocationID}`);
                ownerLocationDetails.push(`Location:" ${ownerLocation.location}`);
                ownerLocationDetails.push(`Location Name: ${location.locationName}`);
                ownerLocationDetails.push(`Owner: ${ownerLocation.owner}`);
                ownerLocationDetails.push(`Owner Name: ${owner.ownerName}`);
                ownerLocationDetails.push(`Owner Percantage: ${ownerLocation.ownPercentage*100}%`);
                ownerLocationDetails.push(`Owner Capital: $${ownerLocation.ownerCapital}`);
                ownerLocationDetails.push(`Created At: ${ownerLocation.createdAt}`);
                ownerLocationDetails.push(`Updated At: ${ownerLocation.updatedAt}`);
                ownerLocationDetails.push("----------------------------------------------------");
                ownerLocationDetails.push("\n");
            }
        }

        return ownerLocationDetails.join("\n");
    })

})

