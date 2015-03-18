# Installation and Configuration #

_Semanticgraph_ is designed to support flexible configurations via a central configuration file _config.js_. How to set up it properly is described here.

## Define Server URIs ##

First of all, you have to adjust the URIs of the available servers. Note that since browsers come with cross-domain policies, JS is not allowed to load data cross domains. Therefore you have to use proxys hosted on your domain which loads content from certain servers and passed through it to _semanticgraph_. There are two examples of such simple proxys available in source: _proxy.php_ and _proxy2.php_. If it does not work, consider following points:
  * You may adjust the queryURI parameters in _config.js_ in _AvailableConfigs_ at _servers_ section.
  * PHP has to be installed and configured properly that scripts are allowed to load content from foreign domains. For example take a look at the [allow\_url\_fopen](http://www.php.net/manual/de/filesystem.configuration.php#ini.allow-url-fopen) parameter.