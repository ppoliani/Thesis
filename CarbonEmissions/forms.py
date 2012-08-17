
from django import forms

#Form for keeping data when user creates a new trip
class TripForm(forms.Form):
    #data for trip
    type = forms.CharField(max_length=10)
    tripName = forms.CharField(max_length=50)
    date= forms.DateField()
    time = forms.TimeField()
    
    #data for trip leg and for start and end addresses 
    startAddrCountry = forms.CharField(max_length=50)
    startAddrCounty = forms.CharField(max_length=50, required=False)
    startAddrCity = forms.CharField(max_length=30)
    startAddrStreet = forms.CharField(max_length=100)
    startAddrPostalCode = forms.CharField()
    startAddrLongitude = forms.CharField(max_length=10)
    startAddrLatittude = forms.CharField(max_length=10)
    startAddrName = forms.CharField(max_length=10, required=False)
    startAddrVisibility = forms.Select(choices=((True, 'Visible', ), (False, 'Non-Visible')))
    
    endAddrCountry = forms.CharField(max_length=50)
    endAddrCounty = forms.CharField(max_length=50, required=False)
    endAddrCity = forms.CharField(max_length=30)
    endAddrStreet = forms.CharField(max_length=100)
    endAddrPostalCode = forms.CharField()
    endAddrLongitude = forms.CharField(max_length=10)
    endAddrLatittude = forms.CharField(max_length=10)
    endAddrName = forms.CharField(max_length=10, required=False)
    endAddrVisibility = forms.Select(choices=((True, 'Visible', ), (False, 'Non-Visible')))
    
    step = forms.CharField()
    
    #data for transport mean
    manufacturer = forms.CharField(max_length=30, required=False)
    model = forms.CharField(max_length=50, required=False)
    #this is the name of the car that used add
    description = forms.CharField(max_length=100)
    engineCapacity = forms.CharField(max_length=5)
    fuelType = forms.CharField(max_length=30)
    transmission = forms.CharField(max_length=20, required=False)
    