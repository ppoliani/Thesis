from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.auth.views import login, logout
from CarbonEmissions.views import parseCarCsv, createTrip, getCarManufacturers, getCarModels, \
                                getCarModelData, getTransportMeanId, saveTrip, saveTripLeg, prov, getGeneralCarDescription, \
                                computeTripLegsEmissions, getBusDescriptions, getTaxiDescriptions, getMotorcycleDescriptions, \
                                getFerryDescriptions, getRailDescriptions, getAviationDescriptions, graph, getTripInfo, \
                                report, getTripLegInfo, getTransportMeanReport, getProvGraph, getProvNodeInfo

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'Thesis.views.home', name='home'),
    # url(r'^Thesis/', include('Thesis.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    (r'^admin/', include(admin.site.urls)),
    (r'accounts/login/$', login, {'template_name': 'auth/login.html'}),
    (r'accounts/logout/$', logout),
    (r'^parse/$', parseCarCsv),
    (r'^add-trip/$', createTrip),
    (r'^get-general-car-descriptions/$', getGeneralCarDescription),
    (r'^get-bus-descriptions/$', getBusDescriptions),
    (r'^get-taxi-descriptions/$', getTaxiDescriptions),
    (r'^get-motorcycle-descriptions/$', getMotorcycleDescriptions),
    (r'^get-ferry-descriptions/$', getFerryDescriptions),
    (r'^get-rail-descriptions/$', getRailDescriptions),
    (r'^get-aviation-descriptions/$', getAviationDescriptions),
    (r'^get-manufacturers/$', getCarManufacturers),
    (r'^get-car-models/$', getCarModels),
    (r'^get-car-model-data/$', getCarModelData),
    
    (r'^get-transportMeanId/$', getTransportMeanId),
    (r'^save-trip/$', saveTrip),
    (r'^save-trip-leg/$', saveTripLeg),
    (r'^compute-trip-leg-emissions/$', computeTripLegsEmissions),
    (r'^prov/$', prov),
    
    (r'^report/$', report),
    (r'^get-trip-info/$', getTripInfo),
    (r'^get-trip-leg-info/$', getTripLegInfo),
    (r'^get-tranpsport-mean-report/$', getTransportMeanReport),
    
    (r'^graph/$', graph),
    (r'^get-prov-graph/$', getProvGraph),
    (r'^get-prov-node-info/$', getProvNodeInfo),
)

    