---
title: Concepts and Terms
layout: docs
weight: 10
---

This section is intended to give a quick overview of the main concepts and terminology used in this guide and how they relate to Environment Manager.

### Concept Summary

The diagram below shows the logical relationships between AWS and Environment Manager entities.

![](/environment-manager/assets/images/concepts.png)

### AWS Terms

<table>
  <tr>
    <th width="30%">Term</th>
    <th>Description / EM Usage</th>
  </tr>
  <tr>
    <td>
      <a name="vpcs" href="https://aws.amazon.com/vpc/">VPC</a>
    </td>
    <td>
      <p>Virtual Private Cloud – a custom network within AWS where you can control subnets, IP ranges and other network configuration. </p>
      <p>Each AWS Account can contain 1 or more VPCs. These act as self-contained networks but can be peered or linked together to enable cross-VPC and/or cross-Account connectivity.</p>
      <p>We recommend creating separate VPCs for each [Environment Type](/environment-manager/docs/concepts#environment-type) to provide the best isolation for resources.</p>
    </td>
  </tr>
  <tr>
    <td>
      <a name="amis" href="http://docs.aws.amazon.com/general/latest/gr/glos-chap.html#AutoScalingGroup">AMI</a>
    </td>
    <td>
      <p>Amazon machine image – a virtual machine image with a particular configuration on it. May be basic or ‘baked’ meaning it includes everything to run an application on boot.</p>
      <p>EM assumes that all AMIs used with the tool have both the Consul Agent and EM Deployment Agent included on the image. Puppet roles can also be specified and passed in user data.</p>
      <p>A particular naming convention is assumed for AMIs to help provide more intelligent info on out of date instances. See [Conventions](/environment-manager/docs/more/conventions)</p>
    </td>
  </tr>
  <tr>
    <td>
      <a name="instances" href="http://docs.aws.amazon.com/general/latest/gr/glos-chap.html#instance">Instance</a>
    </td>
    <td>
      <p>A virtual machine in AWS based on an AMI.</p>
      <p>Instances run Services deployed by Environment Manager and report on their health.</p>
      <p>Environment Manager assumes that all instances it is responsible for are part of an Auto-Scaling Group.</p>
    </td>
  </tr>
  <tr>
    <td>
      <a name="asgs" href="http://docs.aws.amazon.com/general/latest/gr/glos-chap.html#AutoScalingGroup">Auto-Scaling Group (ASG)</a>
    </td>
    <td>
      <p>A container for a group of related instances. </p>
      <p>EM uses ASGs to manage groups of instances performing the same role. For example, by setting the desired number of instances and using the ASG to ensure exactly that many are always running.</p>
      <p>A common misconception is that adding instances to an ASG will automatically mean they scale dynamically to match load. Instead, ASGs provide flexibility to decide how to scale – manually, on a schedule, or using full dynamic scaling policies where appropriate.</p> 
      <p>Note that in an ASG, all servers are expected to run the same application services. Having a single server in a group run an extra element is an anti-pattern often seen in physical datacentres. Doing this in AWS makes automation and recovery more complicated. Instead, 2 ASGs should be used for the different configurations - each sized to its specific workload.</p>
    </td>
  </tr>
  <tr>
    <td>
      <a name="launch-configs" href="http://docs.aws.amazon.com/general/latest/gr/glos-chap.html#launchconfiguration">Launch Configuration</a>
    </td>
    <td>
      <p>A launch configuration is used by an ASG to control the properties of new EC2 instances when scaling-up.</p>
      <p>Launch Configurations specify the AMI to use, the server size, security groups and many other properties.</p>
      <p>Changing the Launch Configuration does not affect any of the existing instances in an ASG, only new machines created after the update. This is an important point to remember when using Environment Manager.</p>
      <p>A handy trick to update an ASG with a new Launch Configuration is as follows:</p>

      <ul>
        <li>Update the Launch Configuration with the new settings e.g. instance type, security group etc.</li>
        <li>Manually double the size of the ASG, this will cause a new set of machines to boot based on the new Launch Configuration</li>
        <li>Wait for the new machines to come into service, then manually half the size of the ASG. </li>
        <li>By default, AWS will terminate machines using the older Launch Configuration first, leaving the ASG with only updated instances.</li>
      </ul>

      <p>This is a great way to patch servers by allowing the rollout of new AMIs without affecting uptime.</p>
      <p>Environment Manager automatically creates a separate Launch Configuration for each ASG with a matching name to allow ASGs to evolve separately over time without affecting other resources.</p>
    </td>
  </tr>
  <tr>
    <td>
      <a name="user-data" href="http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html">User Data</a>
    </td>
    <td>
      <p>A means of supplying configuration and optional scripts to execute when an instance boots.</p>
      <p>User data is specified as a property on the Launch Configuration when using ASGs. EM has user data template files for Windows and Linux that can be customised to suit your needs.</p>
    </td>
  </tr>
  <tr>
    <td>
      <a name="iam" href="https://aws.amazon.com/iam/">IAM</a>
    </td>
    <td>
      <p>A good understanding of IAM is required to help with [Link: initial EM setup IAM section].</p>
      <p>From a user point of view, EM uses IAM to specify the [Instance Profiles](http://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2_instance-profiles.html) to associate with each ASG during deployment. These allow specific AWS permissions to be granted to instances and should map to the application’s requirements e.g. to manage SQS queues.</p>
    </td>
  </tr>
  <tr>
    <td>
      <a name="security-groups" href="http://docs.aws.amazon.com/general/latest/gr/glos-chap.html#SecurityGroup">Security Groups</a>
    </td>
    <td>
      <p>Security Groups are essentially statefull firewall rules that can be applied to an instance in order to control incoming and outgoing traffic.</p>
      <p>EM uses Security Groups to specify the network traffic rules that should be associated with each ASG created during deployment. Multiple security groups can be set, for example a common group with base rules for the Environment as a whole, and specific Security Groups for particular applications.</p>
    </td>
  </tr>
</table>

<a href="#top">^ Back to top</a>

### Environment Manager Concepts

<table>
  <tr>
    <th width="30%">Term</th>
    <th>Description / EM Usage</th>
  </tr>
  <tr>
    <td>
      <strong><a name="environment-types" href="#">Environment Type</a></strong>
    </td>
    <td>
      <p>Relates to the purpose of a group of environments. For example: Development, Integration, Performance Testing, Production, UAT etc.</p>
      <p>Environment Types hold settings that are common to all environments of that type, for example, which AWS account they belong to, which Consul Data Centre to use etc.</p>
      <p>Typically, a separate VPC is used to represent each Environment Type to provide the best isolation of resources, however a single VPC can be used for more than one Environment Type where useful. A single Environment Type cannot span more than one VPC.</p>
    </td>
  </tr>
  <tr>
    <td>
      <strong><a name="environments" href="#">Environment</a></strong>
    </td>
    <td>
      <p>An environment is a logical grouping of AWS resources used for a particular purpose and owned by a particular team.</p>
      <p>Environments exist primarily as an abstraction within Environment Manager realised in AWS through resource tags. Environments allow a group of resources to be managed as a whole, for example, scheduling Development environments to be shut down overnight.</p>
      <p>Environments, even of the same type, can be quite different in size and shape depending on the [Link: Deployment Map] selected and what has actually been deployed. Environments only ever contain the infrastructure needed to support the [Link: Services] explicitly deployed there. This helps minimise costs compared to the more common templated pattern of other tools. Of course, environments can also be made to be identical by deploying the same Services with the same Deployment Map.</p>
      <p>Environment Manager includes features to compare settings across Environments, e.g. to view differences in the versions of applications deployed to development, integration and production Environments.</p>
    </td>
  </tr>
  <tr>
    <td>
      <strong><a name="services" href="#">Service</a></strong>
    </td>
    <td>
      <p>This is one of the most overloaded terms in IT. In the context of Environment Manager, this term is most often used to refer to an application, micro-service or similar deployable package that can be registered, configured and deployed to AWS. In other words, Services are the applications that your company develops, deploys and operates.</p>
      <p>A Service does not have to be an HTTP/S website or API, it could be a background service e.g. running batch jobs or responding to queue input.</p>
    </td>
  </tr>
  <tr>
    <td>
      <strong><a name="deployment-maps" href="#">Deployment Map</a></strong>
    </td>
    <td>
      <p>This is the concept in EM that tends to cause the most confusion.</p>

      <p>Deployment Maps can be thought of as a design, skeleton or template for how to deploy services to an Environment. They specify which server roles (Auto-Scaling Groups) there should be and which Services should be deployed to each. They also specify the initial Launch Configuration settings – instance type, IAM role, Security Groups etc. </p>

      <p>Deployments are distinct from Environments since multiple Environments can be created from the same Deployment Map, and each may then evolve independently once created.</p>

      <p>Environments can choose which Deployment Map to use, and can therefore either share a common map or create something specific depending on requirements. Typically there is at least 1 Deployment Map for each Environment Type.</p>

      <p>When you deploy a service to an environment, Environment Manager first looks at the Environment’s Deployment Map to determine which server role (ASG) to deploy to. If the ASG doesn’t already exist, Environment Manager will create a new ASG based on the settings in the Deployment Map. If the ASG does already exist, it will be left alone and deployed to as-is.</p>

      <p>The key points to remember are that:</p>

      <ul>
        <li>Deployment Maps are only used for initial deployments i.e. as a skeleton for building new environments or new ASGs within existing environments. After initial deployment, AWS is the master of the configuration. This means an Environment and its Deployment Map may diverge unless both are consciously updated to remain in sync. This is not necessarily a problem, but should be kept in mind.</li>
        <li>
          There are several reasons why a Deployment Map and an Environment may get out of sync. For example:
          <ul>
            <li>Users may make manual changes to an Environment directly in the AWS console</li>
            <li>A Deployment Map may be updated after some Services have already been deployed to an Environment with the older configuration</li>
            <li>An Environment may change which Deployment Map it uses after some Services have already been deployed</li>
          </ul>
        </li>
        <li>Modifying a Deployment Map has no immediate effect on any existing Environments or AWS resources that use the map. Changing the Deployment Map simply changes the template for the next new usage.</li> 
        <li>If you delete an ASG and its associated Launch Configuration from AWS and redeploy, then EM will treat it as a new deployment and use the latest Deployment Map settings.</li>
        <li>EM will never update the settings of an existing ASG during deployment. It considers AWS the master of this data and respects any manual changes that may have been made outside of its knowledge.</li>
        <li>You can modify the ASG settings and Launch Configuration for existing infrastructure from Environment Manager, but this is a separate process in the Environments section of the tool and does not need to involve Deployment Maps.</li>
      </ul>

      <strong>Why Deployment Maps?</strong>
      <p>The concept came about from a desire to ensure AWS remained the master of ASG/Launch Configuration settings whilst also being able to ensure Environments could be created consistently and identically where useful.</p> 

      <p>Deployment Maps allow initial settings to be stored outside of AWS and used to bootstrap Environments for consistency. However, once used, AWS takes over and we don’t store any local state about ASG settings. This ensures we can handle manual changes made outside of Environment Manager and can properly respond to the dynamic nature of Cloud infrastructure.</p>
    </td>
  </tr>
  <tr>
    <td>
      <strong><a name="clusters" href="#">Clusters</a></strong>
    </td>
    <td>
      <p>Our term for cross-functional development teams.</p> 
      <p>Clusters own Services and Environments and can be granted particular sets of permissions within the tool. See [Permissions](environment-manager/docs/user-guide/permissions).</p>
    </td>
  </tr>
  <tr>
    <td>
      <strong><a name="maintenance-mode" href="#">Maintenance Mode</a></strong>
    </td>
    <td>
      <p>Environment Manager includes an operational facility to put particular instances in ‘Maintenance Mode’. In practice this means that:</p>

      <ul>
        <li>The instance is updated in Consul to prevent its services receiving any more traffic from the Load Balancer</li>
        <li>The instance is suspended from its containing Auto-Scaling Group. This allows the server to be patched, rebooted or have its logs analysed without the ASG marking it as unhealthy and terminating it (and then building a new machine to replace it)</li>
      </ul>

      <p>Once work on the server is complete it can either be terminated or taken out of Maintenance Mode which will bring it back into live service.</p>
      <p>Note: it is often advisable to scale-up the ASG before putting one of its instances in Maintenance Mode to retain appropriate capacity and fault tolerance.</p>
    </td>
  </tr>
  <tr>
    <td>
      <strong><a name="security-zones" href="#">Security Zone</a></strong>
    </td>
    <td>
      <p>A security zone is a logical concept that groups ASGs based on the risk profile of the Services they contain. For example, Services that deal with PCI payment data will have different security requirements to those hosting public reference data.</p>
      <p>The Security Zone attribute is configured as part of the [Deployment Map] and can be used to automatically and dynamically apply appropriate security safeguards based on the value set. For example, to restrict which subnets particularly sensitive applications can be deployed to.</p>
    </td>
  </tr>
  <tr>
    <td>
      <strong><a name="lb-settings" href="#">LB Setting</a></strong>
    </td>
    <td>
      <p>A Load Balancer setting. Specifies the rules and conditions for routing traffic to one or more Upstreams. For example, requests to api.website.com over https from this source should go to Upstream X.</p> 
      <p>The same Upstream can be referenced by multiple LB settings.</p>
    </td>
  </tr>
  <tr>
    <td>
      <strong><a name="lb-upstreams" href="#">LB Upstream</a></strong>
    </td>
    <td>
      <p>A logical target for receiving and handling a particular type of traffic.</p>
      <p>Typically, there should be a single Upstream per Service per Environment. Multiple Upstreams per Service are also supported for certain edge cases.</p>
      <p>Upstreams route traffic to one or more Hosts that run the Service to actually process received traffic.</p>
    </td>
  </tr>
  <tr>
    <td>
      <strong><a name="hosts" href="#">Host</a></strong>
    </td>
    <td>
      <p>A server or group of servers (ASG) that can process traffic for an Upstream i.e. that are running the Service the Upstream is configured to handle.</p>
      <p>Upstreams can contain one or more Hosts. Each host may be active or inactive with only the active hosts receiving traffic passed to the Upstream. </p>
      <p>In our implementation, a Host is typically the Consul Service name or DNS name of an Auto-scaling Group. However, any valid DNS or IP supported by [Link:Upstreamr]/[Link:NGINX] can be used.</p> 
      <p>Hosts are related to the concept of [Link: Blue/Green deployment http://martinfowler.com/bliki/BlueGreenDeployment.html] versions or ‘slices’. Active hosts are currently serving traffic, inactive/offline hosts can be targets for the next deployment. In this way, by simply changing the active hosts, you can toggle between Blue and Green slices. This is how the Toggle API in Environment Manager works.</p>
    </td>
  </tr>
</table>

<a href="#top">^ Back to top</a>

### Consul

It is useful to have an understanding of some core Consul concepts such as: nodes, data centres, services and health checks. Also the difference in Consul between the Catalogue and the Key Value store.

The [Consul Website](https://www.consul.io/) gives a good overview of all these concepts.

Environment Manager uses Consul for service discovery, health checking, and deployment. For deployment, the Key Value store is used to hold the target services that should be deployed, and the Catalogue holds what is currently/actually deployed. The Environment Manager deployment agent running on each instance then simply looks for differences between these two sources and downloads and installs any missing packages to converge the state. This provides a highly scalable and concurrency safe deployment platform.

More information on Consul setup can be found [here](/environment-manager/docs/setup/consul). 

More information about how deployment works using Consul can be found [here](/environment-manager/docs/more/consul).

<a href="#top">^ Back to top</a>