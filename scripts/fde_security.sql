-- FDE ENTERPRISE SECURITY & SEMANTIC LAYER
USE master;
GO

IF SUSER_ID('USR_FDE_RO') IS NULL
BEGIN
    CREATE LOGIN USR_FDE_RO
    WITH PASSWORD = N'FdeEnterprisePass123!',
         CHECK_POLICY = ON;
END;
GO

USE LogisticsDB;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.schemas WHERE name = 'FDE_VIEWS'
)
BEGIN
    EXEC('CREATE SCHEMA FDE_VIEWS AUTHORIZATION dbo');
END;
GO

CREATE OR ALTER VIEW FDE_VIEWS.VW_LOGISTICS_OPERATIONS
AS
SELECT
    [timestamp] AS [Timestamp],
    vehicle_gps_latitude AS [Vehicle_Latitude],
    vehicle_gps_longitude AS [Vehicle_Longitude],
    fuel_consumption_rate AS [Fuel_Consumption_Rate],
    eta_variation_hours AS [ETA_Variation_Hours],
    traffic_congestion_level AS [Traffic_Congestion_Level],
    warehouse_inventory_level AS [Warehouse_Inventory_Level],
    loading_unloading_time AS [Loading_Unloading_Time],
    handling_equipment_availability AS [Handling_Equipment_Availability],
    order_fulfillment_status AS [Order_Fulfillment_Status],
    weather_condition_severity AS [Weather_Condition_Severity],
    port_congestion_level AS [Port_Congestion_Level],
    shipping_costs AS [Shipping_Costs],
    supplier_reliability_score AS [Supplier_Reliability_Score],
    lead_time_days AS [Lead_Time_Days],
    historical_demand AS [Historical_Demand],
    iot_temperature AS [IoT_Temperature],
    cargo_condition_status AS [Cargo_Condition_Status],
    route_risk_level AS [Route_Risk_Level],
    customs_clearance_time AS [Customs_Clearance_Time],
    driver_behavior_score AS [Driver_Behavior_Score],
    fatigue_monitoring_score AS [Fatigue_Monitoring_Score],
    disruption_likelihood_score AS [Disruption_Likelihood_Score],
    delay_probability AS [Delay_Probability],
    risk_classification AS [Risk_Classification],
    delivery_time_deviation AS [Delivery_Time_Deviation]
FROM dbo.logistics_data;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.database_principals
    WHERE name = 'USR_FDE_RO'
)
BEGIN
    CREATE USER USR_FDE_RO FOR LOGIN USR_FDE_RO;
END;
GO

GRANT SELECT ON OBJECT::FDE_VIEWS.VW_LOGISTICS_OPERATIONS
TO USR_FDE_RO;
GO

DENY SELECT ON OBJECT::dbo.logistics_data TO USR_FDE_RO;
DENY SELECT ON OBJECT::dbo.shipments TO USR_FDE_RO;

DENY INSERT, UPDATE, DELETE, ALTER
ON SCHEMA::dbo TO USR_FDE_RO;
GO

PRINT 'FDE Semantic Layer Setup Complete!';
GO
