import os
import sys

sys.path.append('C:\xampp\htdocs\Thesis\CarbonEmissions')
sys.path.append('C:\xampp\htdocs\Thesis')
os.environ['DJANGO_SETTINGS_MODULE'] = 'Thesis.settings'

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()