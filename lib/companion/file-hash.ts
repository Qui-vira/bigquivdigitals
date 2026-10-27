/**
 * The SHA-256 of the product zip, printed in the delivery email so the buyer can
 * verify the download. UPDATE BOTH VALUES EVERY TIME THE ZIP IS REBUILT
 * (certutil -hashfile TheEditCompanion.zip SHA256). A test fails if the hash is not 64 hex chars.
 */
export const DELIVERY_FILE_SHA256 = "fd7c3c88665d838cdda409c9116223b9b0617b33c88a31a023d83e3fa43a3407";
export const DELIVERY_FILE_BYTES = 11_753_051;
