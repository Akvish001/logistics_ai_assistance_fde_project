USE LogisticsDB;

SELECT * FROM shipments;

USE LogisticsDB;

SELECT
    shipment_id,
    origin,
    destination,
    weight,
    status
FROM shipments;

SELECT COUNT(*) AS total_shipments
FROM shipments;

SELECT COUNT(*) AS total_records
FROM logistics_data;

SELECT risk_classification, COUNT(*) AS total
FROM logistics_data
GROUP BY risk_classification;

SELECT AVG(fuel_consumption_rate) AS avg_fuel_consumption
FROM logistics_data;

SELECT TOP 10 *
FROM logistics_data
WHERE risk_classification = 'High Risk';