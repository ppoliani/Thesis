
from django.contrib import  admin
from CarbonEmissions.models import UserProfile, EmissionFactorSource, CarEmissionFactor, BusEmissionFactor, TaxiEmissionFactor, \
                                   RailEmissionFactor, FerryEmissionFactor, MotorcycleEmissionFactor, aviationEmissionFactor, \
                                   GeneralCar, TransportMeanEmissionFactor
#add models to admin app
admin.site.register(UserProfile)
admin.site.register(EmissionFactorSource)
admin.site.register(CarEmissionFactor)
admin.site.register(BusEmissionFactor)
admin.site.register(TaxiEmissionFactor)
admin.site.register(RailEmissionFactor)
admin.site.register(FerryEmissionFactor)
admin.site.register(MotorcycleEmissionFactor)
admin.site.register(aviationEmissionFactor)
admin.site.register(GeneralCar),
admin.site.register(TransportMeanEmissionFactor)




